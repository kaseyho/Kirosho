"""Generate offline ShadeShift sun vectors; no network is used by this script.

Run: .venv/bin/python Assets/Tools/GenerateSolarFixtures.py
Install: python3 -m pip install -r Assets/Tools/SolarRequirements.txt
The JSON bytes are the hash input; the TypeScript export embeds the same data.
"""

from __future__ import annotations

import hashlib
import json
import math
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "Assets" / "Data"
DATE = "2026-10-20"
TZ = "Asia/Singapore"
LATITUDE = 1.3521
LONGITUDE = 103.8198
DELTA_T = float(pvlib.spa.calculate_deltat(2026, 10))


def solar_rows(minutes: list[float]) -> list[list[float]]:
    midnight = pd.Timestamp(DATE, tz=TZ)
    times = pd.DatetimeIndex([midnight + pd.Timedelta(minutes=m) for m in minutes])
    positions = pvlib.solarposition.spa_python(
        times, LATITUDE, LONGITUDE, altitude=15, pressure=101325,
        temperature=30, delta_t=DELTA_T, atmos_refract=0.5667, how="numpy",
    )
    rows = []
    for minute, (_, position) in zip(minutes, positions.iterrows()):
        # Geometric elevation: no weather/refraction estimate determines geometry.
        elevation = math.radians(float(position["elevation"]))
        azimuth = math.radians(float(position["azimuth"]))
        east = math.cos(elevation) * math.sin(azimuth)
        north = math.cos(elevation) * math.cos(azimuth)
        up = math.sin(elevation)
        rows.append([minute, round(east, 12), round(north, 12), round(up, 12)])
    return rows


def reference_case() -> dict:
    # Published SPA case, also reproduced in pvlib's official test fixtures:
    # https://github.com/pvlib/pvlib-python/blob/main/tests/conftest.py
    # https://github.com/pvlib/pvlib-python/blob/main/tests/test_solarposition.py
    time = "2003-10-17T12:30:30-07:00"
    result = pvlib.solarposition.spa_python(
        pd.DatetimeIndex([time]), 39.742476, -105.1786, altitude=1830.14,
        pressure=82000, temperature=11, delta_t=67, atmos_refract=0.5667,
        how="numpy",
    ).iloc[0]
    expected = {"apparent_zenith": 50.111622, "azimuth": 194.340241}
    actual = {key: float(result[key]) for key in expected}
    for key, value in expected.items():
        assert abs(actual[key] - value) < 0.000005, (key, actual[key], value)
    return {
        "time": time, "latitude": 39.742476, "longitude": -105.1786,
        "altitudeM": 1830.14, "pressurePa": 82000, "temperatureC": 11,
        "deltaTSeconds": 67, "atmosRefractDegrees": 0.5667,
        "expectedDegrees": expected,
        "actualDegrees": {key: round(value, 12) for key, value in actual.items()},
        "toleranceDegrees": 0.000005,
    }


def write_changed(path: Path, content: bytes) -> None:
    if not path.exists() or path.read_bytes() != content:
        path.write_bytes(content)


def main() -> None:
    start = pd.Timestamp(DATE + "T12:00:00", tz=TZ)
    end = pd.Timestamp(DATE + "T17:00:00", tz=TZ)
    assert start.tz_convert("UTC").hour == 4
    assert end.tz_convert("UTC").hour == 9
    payload = {
        "schema": "shadeshift-solar-v1",
        "metadata": {
            "date": DATE, "timezone": TZ,
            "latitude": LATITUDE, "longitude": LONGITUDE,
            "startLocal": start.isoformat(), "endLocal": end.isoformat(),
            "startUTC": start.tz_convert("UTC").isoformat(),
            "endUTC": end.tz_convert("UTC").isoformat(),
            "altitudeM": 15, "pressurePa": 101325, "temperatureC": 30,
            "deltaTSeconds": round(DELTA_T, 9),
            "deltaTMethod": "pvlib.spa.calculate_deltat empirical estimate",
            "direction": "east/north/up unit vector towards the sun",
            "elevationKind": "geometric elevation, not apparent elevation",
            "minuteUnit": "minutes since local midnight in Asia/Singapore",
            "algorithm": "pvlib.solarposition.spa_python / NREL SPA",
            "generatorVersion": "1.0.0",
            "generatorSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "python": platform.python_version(), "pvlib": pvlib.__version__,
            "numpy": np.__version__, "pandas": pd.__version__,
            "documentation": "https://pvlib-python.readthedocs.io/en/stable/reference/generated/pvlib.solarposition.spa_python.html",
            "referenceSource": "https://github.com/pvlib/pvlib-python/blob/main/tests/conftest.py",
        },
        "inspection": solar_rows(list(range(720, 1021))),
        "evaluation5": solar_rows([720 + 2.5 + i * 5 for i in range(60)]),
        "evaluation1": solar_rows([720 + 0.5 + i for i in range(300)]),
        "referenceSamples": solar_rows([540, 720, 840, 900, 1020]),
        "nrelReference": reference_case(),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    digest = hashlib.sha256(canonical).hexdigest()
    export = dict(payload, sha256=digest)
    source = "// Generated by Assets/Tools/GenerateSolarFixtures.py. Do not edit.\n"
    source += "export const SOLAR_FIXTURES = "
    source += json.dumps(export, sort_keys=True, separators=(",", ":"), allow_nan=False)
    source += " as const;\n"
    OUT.mkdir(parents=True, exist_ok=True)
    write_changed(OUT / "SolarFixtures.json", canonical)
    write_changed(OUT / "SolarFixtures.ts", source.encode())
    print(json.dumps({
        "sha256": digest, "inspectionSamples": len(payload["inspection"]),
        "fiveMinuteSamples": len(payload["evaluation5"]),
        "oneMinuteSamples": len(payload["evaluation1"]),
        "nrelReference": payload["nrelReference"],
    }, indent=2))


if __name__ == "__main__":
    main()
