/** Planned parametric geometry. All dimensions passed here are centimetres. */
export type ShadeColour=[number,number,number,number]
export class ShadeMesh {
  readonly object:SceneObject
  readonly visual:RenderMeshVisual
  private builder:MeshBuilder
  private vertices:number[]=[]
  private indices:number[]=[]
  constructor(parent:SceneObject,name:string,material:Material) {
    this.object=global.scene.createSceneObject(name);this.object.setParent(parent)
    this.visual=this.object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    this.builder=new MeshBuilder([{name:"position",components:3},
      {name:"normal",components:3,normalized:true},{name:"color",components:4}])
    this.builder.topology=MeshTopology.Triangles;this.builder.indexType=MeshIndexType.UInt16
    this.visual.mesh=this.builder.getMesh();this.visual.mainMaterial=material
  }
  begin():void {this.vertices=[];this.indices=[]}
  box(x:number,y:number,z:number,width:number,height:number,depth:number,c:ShadeColour):void {
    const x0=x-width/2,x1=x+width/2,y0=y-height/2,y1=y+height/2,z0=z-depth/2,z1=z+depth/2
    const face=(a:number[],b:number[],d:number[],e:number[],normal:number[],shade:number)=>{
      const colour=[c[0]*shade,c[1]*shade,c[2]*shade,c[3]],base=this.vertices.length/10
      this.vertices.push(...a,...normal,...colour,...b,...normal,...colour,
        ...d,...normal,...colour,...e,...normal,...colour)
      this.indices.push(base,base+1,base+2,base,base+2,base+3)
    }
    face([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[1,0,0],.82)
    face([x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0],[-1,0,0],.72)
    face([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[0,1,0],1)
    face([x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[0,-1,0],.65)
    face([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],.95)
    face([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],.78)
  }
  outline(x:number,y:number,z:number,w:number,d:number,line:number,c:ShadeColour):void {
    this.box(x-w/2+line/2,y,z,line,line,d,c)
    this.box(x+w/2-line/2,y,z,line,line,d,c)
    this.box(x,y,z-d/2+line/2,w,line,line,c)
    this.box(x,y,z+d/2-line/2,w,line,line,c)
  }
  commit():void {
    this.object.enabled=this.indices.length>0
    if(!this.indices.length)return
    const indices=this.builder.getIndicesCount(),vertices=this.builder.getVerticesCount()
    if(indices>0)this.builder.eraseIndices(0,indices)
    if(vertices>0)this.builder.eraseVertices(0,vertices)
    this.builder.appendVerticesInterleaved(this.vertices)
    this.builder.appendIndices(this.indices);this.builder.updateMesh()
  }
}
