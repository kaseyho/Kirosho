// Capture real Lens Studio window frames through macOS ScreenCaptureKit.
// No activation, UI input, permission requests, or synthesized frames.
import Foundation
import AppKit
import ScreenCaptureKit
import AVFoundation
import CoreMedia
import CoreGraphics
import Darwin

private func emit(_ value: [String: Any]) {
    let data = try! JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    print(String(data: data, encoding: .utf8)!)
    fflush(stdout)
}

private final class CaptureObserver: NSObject, SCRecordingOutputDelegate, SCStreamOutput {
    private let lock = NSLock()
    private var completeFrames = 0
    private var started = false
    private var finished = false
    private var failure: String?

    func recordingOutputDidStartRecording(_ output: SCRecordingOutput) {
        lock.lock(); started = true; lock.unlock()
        emit(["status": "RECORDING_STARTED"])
    }
    func recordingOutputDidFinishRecording(_ output: SCRecordingOutput) {
        lock.lock(); finished = true; lock.unlock()
    }
    func recordingOutput(_ output: SCRecordingOutput, didFailWithError error: Error) {
        lock.lock(); failure = error.localizedDescription; finished = true; lock.unlock()
    }
    func stream(_ stream: SCStream, didOutputSampleBuffer sample: CMSampleBuffer,
                of type: SCStreamOutputType) {
        guard type == .screen, sample.isValid,
              let attachments = CMSampleBufferGetSampleAttachmentsArray(sample,
                  createIfNecessary: false) as? [[SCStreamFrameInfo: Any]],
              let rawStatus = attachments.first?[.status] as? Int,
              SCFrameStatus(rawValue: rawStatus) == .complete else { return }
        lock.lock(); completeFrames += 1; lock.unlock()
    }
    func state() -> (started: Bool, finished: Bool, frames: Int, error: String?) {
        lock.lock(); defer { lock.unlock() }
        return (started, finished, completeFrames, failure)
    }
}

@main
private struct RecordLensWindow {
    static func main() async {
        // Initialize this command-line process's WindowServer connection only.
        // This does not activate, move, resize, or send input to any application.
        _ = NSApplication.shared
        do { try await record() }
        catch { emit(["status": "FAILED", "message": error.localizedDescription]); exit(1) }
    }
    static func record() async throws {
        guard CommandLine.arguments.count == 4, CGPreflightScreenCaptureAccess() else {
            throw NSError(domain: "LensCapture", code: 1, userInfo: [NSLocalizedDescriptionKey:
                "Usage: RecordLensWindow output.mp4 durationSeconds exactWindowTitle. Existing Screen Recording permission is required."])
        }
        let outputURL = URL(fileURLWithPath: CommandLine.arguments[1])
        let seconds = min(28, max(1, Double(CommandLine.arguments[2]) ?? 5))
        let title = CommandLine.arguments[3]
        guard !FileManager.default.fileExists(atPath: outputURL.path) else {
            throw NSError(domain: "LensCapture", code: 2, userInfo: [NSLocalizedDescriptionKey:
                "Output already exists; choose a new path."])
        }
        let content = try await SCShareableContent.excludingDesktopWindows(false,
            onScreenWindowsOnly: false)
        let matches = content.windows.filter {
            $0.owningApplication?.bundleIdentifier == "com.snap.LensStudio" && $0.title == title
        }
        guard matches.count == 1, let window = matches.first else {
            throw NSError(domain: "LensCapture", code: 3, userInfo: [NSLocalizedDescriptionKey:
                "Expected exactly one matching Lens Studio window; found \(matches.count)."])
        }
        let filter = SCContentFilter(desktopIndependentWindow: window)
        let scale = CGFloat(filter.pointPixelScale)
        let config = SCStreamConfiguration()
        config.width = Int(window.frame.width * scale) & ~1
        config.height = Int(window.frame.height * scale) & ~1
        config.minimumFrameInterval = CMTime(value: 1, timescale: 30)
        config.showsCursor = false
        config.capturesAudio = false
        config.ignoreShadowsSingleWindow = true
        config.shouldBeOpaque = true
        let observer = CaptureObserver()
        let stream = SCStream(filter: filter, configuration: config, delegate: nil)
        try stream.addStreamOutput(observer, type: .screen,
            sampleHandlerQueue: DispatchQueue(label: "shadeshift.capture.frames"))
        let recordConfig = SCRecordingOutputConfiguration()
        recordConfig.outputURL = outputURL
        recordConfig.outputFileType = .mp4
        recordConfig.videoCodecType = .h264
        let recording = SCRecordingOutput(configuration: recordConfig, delegate: observer)
        try stream.addRecordingOutput(recording)
        emit(["status": "WINDOW_SELECTED", "windowId": window.windowID,
              "windowTitle": title, "windowFrame": ["x": window.frame.minX,
              "y": window.frame.minY, "width": window.frame.width, "height": window.frame.height],
              "width": config.width, "height": config.height, "pointPixelScale": scale])
        try await stream.startCapture()
        for _ in 0..<100 {
            if observer.state().started || observer.state().error != nil { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        guard observer.state().started else {
            try await stream.stopCapture()
            throw NSError(domain: "LensCapture", code: 4, userInfo: [NSLocalizedDescriptionKey:
                observer.state().error ?? "Recording did not start within five seconds."])
        }
        try await Task.sleep(for: .seconds(seconds))
        try await stream.stopCapture()
        for _ in 0..<100 {
            if observer.state().finished { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        let state = observer.state()
        guard state.finished, state.error == nil, state.frames > 0 else {
            throw NSError(domain: "LensCapture", code: 5, userInfo: [NSLocalizedDescriptionKey:
                state.error ?? "No completed recording or frames."])
        }
        emit(["status": "WINDOW_VIDEO_READY", "path": outputURL.path,
              "completeStreamFrames": state.frames,
              "recordedDurationSeconds": CMTimeGetSeconds(recording.recordedDuration),
              "recordedBytes": recording.recordedFileSize])
    }
}
