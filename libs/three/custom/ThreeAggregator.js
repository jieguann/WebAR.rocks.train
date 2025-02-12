"use strict";
var ThreeAggregator = (function(){
  const that = {
    aggregate: function(threeStuff){
      if (threeStuff.type === 'Geometry'){
        return threeStuff;
      }

      const newGeom = new THREE.Geometry();
      threeStuff.traverse(function(threeSubStuff){
        if (threeSubStuff.type !== 'Mesh'){
          return;
        }
        threeSubStuff.updateMatrixWorld();
        newGeom.merge(threeSubStuff.geometry, threeSubStuff.matrixWorld);
      })

      return newGeom;
    } //end aggregate()

  }; //end that
  return that;
})();
