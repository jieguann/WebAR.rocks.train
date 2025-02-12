/**
 * @author ctyeung
 */

function register_threeOFFLoader(){

  THREE.OFFLoader = function () {};

  THREE.OFFLoader.prototype = new THREE.Loader();
  THREE.OFFLoader.prototype.constructor = THREE.OFFLoader;

  THREE.OFFLoader.prototype.load = function ( url, callback ) {

    const that = this;
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {

      if ( xhr.readyState == 4 ) {

        if ( xhr.status == 200 || xhr.status == 0 ) {

          callback( that.parse( xhr.responseText ) );

        } else {

          console.error( 'THREE.OFFLoader: Couldn\'t load ' + url + ' (' + xhr.status + ')' );

        }

      }

    };

    xhr.open( "GET", url, true );
    xhr.send( null );

  };

  THREE.OFFLoader.prototype.parse = function ( data ) {
    
    function vector( x, y, z ) {

      return new THREE.Vector3( x, y, z );

    }

    /*function uv( u, v ) {

      return new THREE.UV( u, 1.0 - v );

    }*/

    function face3( a, b, c){//, normals ) {

      return new THREE.Face3( a, b, c);//, normals );

    }
    
    function face4( a, b, c, d){//, normals ) {
      return new THREE.Face4( a, b, c, d);//, normals );
    }
    
    // really need tessellation for N vertexies
    // will have to learn to use one build-in or write my own
    function face5( a, b, c, d, e){//, n ) {
      return new THREE.Face4( a, b, c, d);//, [n, n, n, n] );
      return new THREE.Face3( d, e, a);//, [n,n,n] );
    }
    
    /*function calcNormal(v1, v2, v3) {
      // cross product - calculate 2 vectors, then cross
      var vector1 = [v1.x-v2.x,
               v1.y-v2.y,
               v1.z-v2.z];
      
      var vector2 = [v3.x-v2.x,
               v3.y-v2.y,
               v3.z-v2.z];
      
      var xProduct = vector(  vector1[1]*vector2[2]-vector1[2]*vector2[1],
            vector1[2]*vector2[0]-vector1[0]*vector2[2],
            vector1[0]*vector2[1]-vector1[1]*vector2[0]);
      return xProduct;
    }*/

    //var group = new THREE.Object3D();
    const jeelizGeom = new THREE.Geometry();
    const vertices = [];
    //const normals = [];
    //const uvs = [];

    data = data.split('\n');
    
    // 1st line: OFF
    const pattern = /OFF/g;
    const result = pattern.exec(data[0]);
    if(result==null) 
      return null;
    
    // 2nd line: vertex_count face_count edge_count
    const str = data[1].toString().replace('\r', '');
    const listCount = str.split(' ');
    const countVertex = parseInt(listCount[0]);
    const countFace = parseInt(listCount[1]);
    const countEdge = parseInt(listCount[2]);
    
    // list of vertex
    for(let cv = 0; cv<countVertex; ++cv) {
      const str = data[cv+2].toString().replace('\r', '');
      const listVertex = str.split(' ');
      jeelizGeom.vertices.push( vector(
        parseFloat( listVertex[ 0 ] ),
        parseFloat( listVertex[ 1 ] ),
        parseFloat( listVertex[ 2 ] )
      ) );
    }

    
    // list of faces
    for(let cf = 0; cf<countFace; ++cf) {
      const str = data[cf+countVertex+2].toString().replace('\r', '');
      const listFace = str.split(' ');
      
      //var geometry = new THREE.Geometry();
      //geometry.vertices = vertices;
      
      const numFace = parseInt(listFace[0]);
      let f = null;
      const v1 = parseInt( listFace[ 1 ]);
      const v2 = parseInt( listFace[ 2 ]);
      const v3 = parseInt( listFace[ 3 ]);
      let v4 = -1;
      
      // flat shading
      /*var n = calcNormal(vertices[v1],
             vertices[v2],
             vertices[v3]);
      */

      switch(numFace) {
        case 3:
          f = face3( v1, v2, v3);//, [n, n, n]);
          break;
      
        case 4:
          v4 = parseInt( listFace[ 4 ] );    
          f = face4( v1, v2, v3, v4);//, [n, n, n, n]);
          break;
      
        case 5: // need to implement a tessellation scheme
          v4 = parseInt( listFace[ 4 ] );    
          const v5 = parseInt( listFace[ 5 ] );    
          f = face4( v1, v2, v3, v4, v5);//, n);
          break;
      
        default:
          break;
      }
      jeelizGeom.faces.push(f);
      //geometry.faces.push( f );
      //jeelizGeom.merge(geometry);
      
      //geometry.computeCentroids(); //XAV <-- obsolete
      //group.add( new THREE.Mesh( geometry, new THREE.MeshLambertMaterial() ) );
    }
    //return group;
    return jeelizGeom;
  } // end THREE.OFFLoader.prototype.parse
} // end register_threeOFFLoader()

window.addEventListener('load', register_threeOFFLoader);