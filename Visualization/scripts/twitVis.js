/** 
 *  TwitViz
 * 
 * This is the custom library written to handle the map 
 * 
 * Initally it was going to contain all the code nessisary to run the 
 * custom parts of the visualizations but after some working we found
 * that it would be best if this section just worked the map, as it was 
 * complex enough.
 */

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
	};
})();



/**
 * Defines the twitterVisualization object
 *  We will be using this as the namespace 
 *  All functions and objects will be in 
 *  this namespace. ( like a package )
 */
tv = {};


/** 
 * Debugging mode
 */
tv.debug = true;


/** 
 * Logging for development 
 */
tv.log = function(args){
	if (window.console && tv.debug) console.log(args);
};


/** 
 * Throw an error 
 */
tv.error = function(args){
	if (window.console) console.error(args);
}


/** 
 * Listener bindiner 
 * 
 * Binds a method to an dom element action
 */
tv.listen = function(target, type, listener) {
  return target.addEventListener
      ? target.addEventListener(type, listener, false)
      : target.attachEvent("on" + type, listener);
};


/** 
 * Canvas Information 
 */

tv.SVG = function(){
	this.root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
}

tv.SVG.prototype.circle = function(x,y,r,color){
	shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	shape.cx.baseVal.value = 25;
	shape.cy.baseVal.value = 25;
	shape.r.baseVal.value = 20;
	shape.setAttribute("fill", color);
	this.root.appendChild(shape);
}




/** 
 * datatype holder
 * 
 * Defines all the information that a point of data is capable of having
 */
tv.datatype = function(values){
	return new tv.DataType(values);
}


/** 
 * DataType object definition
 */
tv.DataType = function(values){
	this.values = values;
};

/**
 * LatLon
 */
tv.latlon = function(lat, lon){
	this.lat = lat;
	this.lon = lon;
	return this;
}











/**
 * Return a new instance of a map
 * @param dataset to map
 */
tv.map = function(data, image){
	return (new this.Map(data, image));
};

/**
 * Constructor for the new map 
 * 
 * Assigns the DOM object and the data
 */
tv.Map = function(canvas, image){
	
	
	/* Set up some storage */
	
	
	var shortName = 'TwitViz';
    var version = '1.0';
    var displayName = 'Twitter data cache';
    var maxSize = 3072*1024*10; //  = 30MB            in bytes 655360
    this.db = openDatabase(shortName, version, displayName, maxSize);



	this.db.transaction(
        function(tx) {
            tx.executeSql("SELECT COUNT(*) FROM MapCache", [], null,
                function(tx, error) {
                    tx.executeSql("CREATE TABLE MapCache (key TEXT, data TEXT)", [], null, null);
                }
            );
        }
    );
	
	
	
	
	
	
	this.filter = {};
	this.canvas  = canvas || document.getElementById('twit-vis');
	if ( this.canvas == undefined ){
		tv.error('Map : no element twit-vis');
		return;
	}else if ( this.canvas.tagName != "CANVAS" ){
		tv.error('Map : element \'twit-vis\' must be of type canvas');
		return;
	}
	
	// Set the image
	this.globe = image[0];
	
	this.globe = new Image(3000.0002,1500.2999);
	this.globe.src = "img/equirectangular_two.svg";
	
	this.globe.map = this;
	
	if ( this.globe == undefined ){
		tv.error('Map : no image object passed');
		return;
	}

	this.canvas.width  = Math.round(Math.min($(this.canvas).width(),this.globe.width));
	this.canvas.height = Math.round((this.globe.height/this.globe.width)*this.canvas.width);

	this.canvas.x_offset = 0;
	this.canvas.y_offset = 0;
	this.canvas.view_width  = this.globe.width;
	this.canvas.view_height = this.globe.height;
	this.canvas.view_scale = 1;
	
	tv.listen(this.canvas, 'mousedown', this.mouseDown);
	tv.listen(this.canvas, 'mouseup', 	this.mouseUp);
	tv.listen(this.canvas, 'mousemove', this.mouseMove);
	tv.listen(this.canvas, 'mousewheel',this.mouseWheel);
	tv.listen(this.canvas, 'dblclick',	this.mouseDblClick);
	
	//tv.log(this.canvas);
	
	this.canvas.onmouseup 		= this.mouseUp;
	this.canvas.onmousewheel	= this.mouseWheel;
	this.canvas.ondblclick		= this.mouseDblClick;
	this.canvas.onmousemove		= this.mouseMove;
	this.canvas.onclick			= this.mouseClick;
	
	
	this.canvas.map = this;
	
	//tv.log(this.canvas);
	
	this.ctx = this.canvas.getContext("2d");
	
	//tv.log(this.ctx);
	
	this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
	
	this.data = new Array();
	this.chunk_factor  = 1/40;
	this.canvas.changed = true;
	
	this.chunk_worker = new Worker('scripts/mapCluster.js');
	this.chunk_worker.map = this;
	
	this.chunk_worker.onmessage = this.chunkComplete;
	
	
	this.hs = null;
	this.ms = null;
	this.he = null;
	this.me = null;
	
};


tv.Map.prototype.db = null;
tv.Map.prototype.data = new Array();
tv.Map.prototype.data_chunk = new Array();
tv.Map.prototype.canvas = new Object();
tv.Map.prototype.ctx = new Object();
tv.Map.prototype.globe = new Object();


tv.Map.prototype.tick = function(){
	this.update();
	this.draw();
}


/** 
 * Update 
 */
tv.Map.prototype.update = function(){

}

/* 
 * Calls the ajax to load the data from the server 
 */
tv.Map.prototype.updateData = function(hs, ms, he, me){
	sendData = {};
	
	if ( hs )
		sendData.hs = hs;
	else
		sendData.hs = this.hs;
		
	if ( ms )
		sendData.ms = ms;
	else
		sendData.ms = this.ms;
	
	if ( he )
		sendData.he = he;
	else
		sendData.he = this.he;

	if ( me )
		sendData.me = me;
	else
		sendData.me = this.me;
		
	this.hs = sendData.hs;
	this.ms = sendData.ms;
	this.he = sendData.he;
	this.me = sendData.me;

	sendData.lang = $('form#lang-form').serialize();

	cacheKey = 'mapv1'+JSON.stringify(sendData);

	v = this;

	/** 
	 * Check to see if we have the data locally, 
	 *   if we dont, then ajax it in and cache it
	 *   otherwise load the data we have stored
	 */
    this.db.transaction(
        function(tx) {
            tx.executeSql("SELECT `data` FROM MapCache WHERE `key`=?", [cacheKey],
                function(tx, result) {
					if (result.rows.length){
						data = JSON.parse(result.rows.item(result.rows.length-1)['data']);
						console.log('cache hit on data');
						v.data = data;
						v.canvas.changed = true;
						v.draw();
                    }else{
						console.log('cache miss');
						$.ajax({
							url:  '/ajax/lang-map.php',
							data: sendData,
							dataType: 'json',
							success: function(r){
								v.setData([]);
								for( i=0; i<r.length; i++){
									d = {};
									d.lat 	= r[i].data.tweet.lng;
									d.lon 	= r[i].data.tweet.lat;
									d.size 	= 5;
									d.color = langs[r[i].data.tweet.lang].color;
									d.tweet = r[i].data.tweet;
									v.addDataPoint(d);
								}

								v.db.transaction(
							        function(tx) {
							            tx.executeSql("INSERT INTO MapCache (`key`, `data`) values(?, ?)", [cacheKey, JSON.stringify(v.data)], null, null);
							        }
							    );

								v.canvas.changed = true;
								v.draw();
							}
						});
					}
                }, null);
            }
        );

}

/** 
 * Draw
 */
tv.Map.prototype.draw = function(){
	if ( false && this.canvas.changed ){
		//console.log('drawing');
		//this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
		this.drawMap().drawData();
		this.canvas.changed = false;
	}
	this.drawMap().drawData();
	
	return this;
	//requestAnimFrame(this.tick());
}


/** 
 * DrawMap 
 * 
 * Method that preforms the map drawing
 */
tv.Map.prototype.drawMap = function(){
	this.ctx.save();
	
	sx = Math.abs(this.canvas.x_offset);
	sy = Math.abs(this.canvas.y_offset);
	sw = this.canvas.view_width;
	sh = this.canvas.view_height;
	
	dh = this.canvas.height;
	dw = this.canvas.width;
	
	this.ctx.drawImage(this.globe, sx, sy, sw, sh, 0, 0, dw, dh);
	this.ctx.restore();
	return this;
}

/**
 * drawData
 *
 * Displays the data
 */ 
tv.Map.prototype.drawData = function(){
	
	$('section#tooltip').hide();
	
	try { 
		if ( typeof(this.data[0]) !== 'object' ){
			//console.log('data not of type array');
			return;
		}
	}catch(e){
		//console.log('no data');
		return;
	}
	
	ctx = this.ctx;
	canvas = this.canvas;
				
	ctx.save();
	
	p_s = Math.max(.3,canvas.view_scale/5)/2;
		
	off_x = (canvas.x_offset/canvas.view_width)*canvas.width;
	off_y = (canvas.y_offset/canvas.view_height)*canvas.height;
		
	max_x = canvas.view_width*canvas.view_scale;
	max_y = canvas.view_height*canvas.view_scale;
	
	/* 
	 * For each point of data in our data array 
	 */	
	for(var index in this.data){
		point = this.data[index];

		ctx.globalAlpha = .8;

		lon = (point.lon)/180;
		lat = (-point.lat)/90;
		lat = lat*((canvas.height/canvas.width))*2;

		point.x = (lon+1)*canvas.width/2;
		point.y = (lat+1)*canvas.height/2;
	
		p_x = (point.x*canvas.view_scale) - off_x;
		p_y = (point.y*canvas.view_scale) - off_y;

		this.ctx.fillStyle = point.color || '#0ff';
	
		/*
		 * If it is outside our current viewport, skip it 
		 */
		if ( p_x < 0 || p_x > max_x || p_y < 0 || p_y > max_y ){
			continue;
		}
	
	
		mult = point.size || 2;
		
		mult = Math.min(8, 25/canvas.view_scale);
	
		ctx.fillRect(p_x-p_s*mult, p_y-p_s*mult, p_s*2*mult, p_s*2*mult); 
	
		if ( canvas.view_scale || 10 ){

			ctx.globalAlpha = 0.1;
	
			ctx.beginPath();
			ctx.arc(p_x, p_y, p_s*mult*3, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();
	
			if ( canvas.view_scale > 15 ){
				ctx.beginPath();
				ctx.arc(p_x, p_y, p_s*3, 0, Math.PI*2, true); 
				ctx.closePath();
				ctx.fill();
			}
		}
		ctx.globalAlpha = 1;
	}
		
		
	this.ctx.restore();

	return this;
}


/**
 * setData(array)
 * 
 * Sets the data to the passed array
 */
tv.Map.prototype.setData = function(data_array){

	this.data = data_array;

	return this;
}

/**
 * addDataPoint(point)
 * 
 * Adds the passed data to the existing data array
 */
tv.Map.prototype.addDataPoint = function(dat){
	
	try {
		this.data.push(dat);
	}catch(e){
		this.data = [dat];
	}

	return this;
}


/* 
 * Details on demand
 * 
 * This method moves the tooltip to the point passed, 
 * changes the content to be the details of the point, 
 * and then fades in the tooltip
 */
tv.Map.prototype.showDetailsFor = function(data){	
	
	canvas = this.canvas;
	
	lon = (data.lon)/180;
	lat = (-data.lat)/90;
	lat = lat*((canvas.height/canvas.width))*2;

	off_x = (canvas.x_offset/canvas.view_width)*canvas.width;
	off_y = (canvas.y_offset/canvas.view_height)*canvas.height;
	
	data.x = (lon+1)*canvas.width/2;
	data.y = (lat+1)*canvas.height/2;

	p_x = (data.x*canvas.view_scale) - off_x + $(canvas).offset().left;
	p_y = (data.y*canvas.view_scale) - off_y + $(canvas).offset().top;
	
	
	$('section#tooltip').stop().fadeIn().css({'top':p_y+1, 'left':p_x+1, 'opacity': 1}).html("<section><strong>Text:</strong> "+data.tweet.text+"</section><section><strong>Lang:</strong> "+data.tweet.lang+"</section><section><strong>Tweeted on:</strong> "+data.tweet.created_at+"</section>").fadeIn();
}











/* 
 * Preforms the zooming action based on the zoom, and mouse position
 */
tv.Map.prototype.preformZoom = function(zoom, mousex, mousey){
	if ( this.canvas.view_scale * zoom > 50 ){
		return;
	}
	else if ( this.canvas.view_scale * zoom <= 1 ){
		this.canvas.x_offset = 0;
		this.canvas.y_offset = 0;
		this.canvas.view_width  = this.globe.width;
		this.canvas.view_height = this.globe.height;
		this.canvas.view_scale  = 1.0;
		this.canvas.changed = true;
	}else{
		new_width  = this.canvas.view_width  / zoom;
		new_height = this.canvas.view_height / zoom;
	
		location_x = (mousex / this.canvas.width);		// -.5 - .5
		location_y = (mousey / this.canvas.height);		// -.5 - .5
	
		new_x_offset = this.canvas.x_offset + location_x * (this.canvas.view_width  - new_width );
		new_y_offset = this.canvas.y_offset + location_y * (this.canvas.view_height - new_height);
	
		this.canvas.x_offset = Math.min(this.globe.width-this.canvas.view_width,Math.max(0,new_x_offset));
		this.canvas.y_offset = Math.min(this.globe.height-this.canvas.view_height,Math.max(0,new_y_offset));
	
		this.canvas.view_width  	 = new_width;
		this.canvas.view_height 	 = new_height;
	    this.canvas.view_scale 		*= Math.abs(zoom);

		this.canvas.changed = true;
	}

	this.tick();
}

/* 
 * Handles checking to see if the user has clicked on a drawn data point 
 */
tv.Map.prototype.mouseClick = function (event){
	$('section#tooltip').hide();
	
	var mousex = event.clientX - $(this).offset().left;
    var mousey = event.clientY - $(this).offset().top + $(window).scrollTop();
	var canvas = this.map.canvas;
	
	off_x = (canvas.x_offset/canvas.view_width)*canvas.width;
	off_y = (canvas.y_offset/canvas.view_height)*canvas.height;
	
	options = [];
	
	max_x = canvas.view_width*canvas.view_scale;
	max_y = canvas.view_height*canvas.view_scale;
	
	min_d = canvas.width * 2;
	min_index = -1;
	
	for(var index=0; index<this.map.data.length; index++){
		point = this.map.data[index];

		lon = (point.lon)/180;
		lat = (-point.lat)/90;
		lat = lat*((canvas.height/canvas.width))*2;

		point.x = (lon+1)*canvas.width/2;
		point.y = (lat+1)*canvas.height/2;
	
		point.p_x = (point.x*canvas.view_scale) - off_x;
		point.p_y = (point.y*canvas.view_scale) - off_y;

		if ( point.p_x < 0 || point.p_x > max_x || point.p_y < 0 || point.p_y > max_y ){
			continue;
		}
		

		tol = 15;
		
		d = Math.sqrt(Math.pow(point.p_x - mousex,2)+Math.pow(point.p_y - mousey,2));
		if ( d < tol && d < min_d ){
			min_d = d;
			min_index = index;
		}
	}
	if(min_index == -1) return;
	
	this.map.showDetailsFor(this.map.data[min_index]);
	
	
}


tv.Map.prototype.mouseDown = function (event){
	var mousex = event.clientX - $(this).offset().left;
    var mousey = event.clientY - $(this).offset().top;

	this.mousedownnow = true;	
				
	this.mousex = mousex;
	this.mousey = mousey;
	
}

/* 
 * Handles dragging of the map 
 */
tv.Map.prototype.mouseMove = function (event){
	
	if ( !this.mousedownnow ){
		return;
	}
	
	this.style.setProperty({cursor:'move'});
	
	this.map.canvas.changed = true;
	
	var mousex = event.clientX - $(this).offset().left;
    var mousey = event.clientY - $(this).offset().top;

	var dx = (this.mousex - mousex),
		dy = (this.mousey - mousey);

	new_x_offset = this.x_offset + dx*(this.view_width/this.width);
	new_y_offset = this.y_offset + dy*(this.view_height/this.height);

	this.x_offset = Math.min(this.map.globe.width-this.view_width,Math.max(0,new_x_offset));
	this.y_offset = Math.min(this.map.globe.height-this.view_height,Math.max(0,new_y_offset));
	
	this.mousex = mousex;
	this.mousey = mousey;
	
	this.map.tick();
}
tv.Map.prototype.mouseUp = function (event){
	
	var mousex = event.clientX - $(this).offset().left;
    var mousey = event.clientY - $(this).offset().top;

	this.mousedownnow = false;
	
	this.style.setProperty({cursor:'pointer'});
	
}

/* 
 * Zoom on double click event 
 */
tv.Map.prototype.mouseDblClick = function (event){
	var mousex = event.clientX - $(this).offset().left;
    var mousey = event.clientY - $(this).offset().top;
	
	this.map.preformZoom(1.5, mousex, mousey);
}

/** 
 * zoom based on mouse wheel event
 */
tv.Map.prototype.mouseWheel = function (event){
    var mousex = event.clientX - $(this).offset().left;
    var mousey = event.clientY - $(this).offset().top + $(window).scrollTop();
    var wheel = event.wheelDelta/120;//n or -n

    var zoom = 1 + wheel/2;

	var alt = 0;
	this.map.preformZoom(zoom, mousex, mousey);
	
	return false;
}
	








