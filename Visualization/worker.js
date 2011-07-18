onmessage = function(e){
  if ( e.data.message === "chunk" ) {
    // Do some computation
    chunk(e.data.data, e.data.factor)
  }else{
	postMessage({status:'error',message:e.data.message+' has no action'});
  }
};


/** 
 * Clone method for making a copy of an object
 */
Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};


function chunk(chunk, chunk_factor){	
	
	var min_distance, 
		min_index, 
		distance, 
		i=0;
	
	while(i<chunk.length){
		
		min_index = -1;
		
		for (var j=i+1; j<chunk.length;j++){
			
			distance = Math.sqrt(Math.pow(chunk[i].lat-(chunk[j].lat||chunk[i].lat),2)+Math.pow(chunk[i].lon-(chunk[j].lon||chunk[i].lon),2));
			
			if ( j == i+1 ){
				min_distance = distance;
			}
			
			if ( j!=i && distance <= min_distance && distance < (chunk[i].size+chunk[j].size)*chunk_factor ){				
				min_distance = distance;
				min_index = j;
			}
		}
		
		if (min_index == -1){
			i++;
		}else{
			
			min_chunk = chunk.splice(min_index,1)[0];

			chunk[i].lat  = (chunk[i].lat*chunk[i].size + (min_chunk.lat)*min_chunk.size)/(chunk[i].size+min_chunk.size);
			chunk[i].lat  = (chunk[i].lon*chunk[i].size + (min_chunk.lon)*min_chunk.size)/(chunk[i].size+min_chunk.size);
			chunk[i].size = (chunk[i].size+min_chunk.size/(chunk[i].size));//Math.abs(min_chunk.size-chunk[i].size);
		}
	}
	
	postMessage({status:'chunked',result:chunk});
}
