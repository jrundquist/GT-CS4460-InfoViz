
var STEP = 1;

//Changes from the number of the tick to the time it represents
function getTime(n)
{
	var hour = Math.floor(n/12);
	var min = ((n - (Math.floor(n/12)*12)) * 5);
	if (min < 10)//Adds additional 0 to prevent #:0 #:5 etc
	{
	  min = "0" + min;
	}
	return "" + hour + ":" + min;
}


//Draws the scale below the slider, labeling every other hour
function drawScale()
{
	
	var fudgeFactor= .33;//Moves ticks to line up with slider
	
	//Makes ticks
	for (var i=0; i <= 12; i++) 
	{
		$("#scaleBars").html($("#scaleBars").html() + "<div class=scaleTick id=scale"+i+">|</div>")
			.css("position","relative").css("top","-.2em");
		$("#scale"+i)
			.css("left",(i * 100/12) - fudgeFactor + "%");
		//console.log(i);
	}
	//$("#scale").html($("#scale").html() + "<br/>");
	
	//Makes labels for ticks
	for (var i=0; i <= 24;  i+=2)
	{
		$("#scaleNums").html($("#scaleNums").html() + "<div class=scaleTick id=scalel"+i+">"+i+":00</div>")
			.css("position","relative").css("top",".6em");
		$("#scalel"+i)
			.css("left",(Math.floor(i/2) * 100/12) - fudgeFactor + "%");
		//console.log(i);
	}
	//$("#scale").
}

//Moves the upper and lower bound up by one step assuming not at max time		
function timeStep(back, size)
{
	
	if ( size ){
		t_step = STEP;
		STEP = size;
	}
	
	if ( !back ){
		if(($("#slider").dragslider('option', 'values')[1] + STEP)<=288)//Checks if at max time
		{
			$("#slider").dragslider('option', 'values',
			[
				$("#slider").dragslider('option', 'values')[0] + STEP,
				$("#slider").dragslider('option', 'values')[1] + STEP
			]);
		}
	}else{
		if(($("#slider").dragslider('option', 'values')[0] - STEP)>=0)//Checks if at max time
		{
			$("#slider").dragslider('option', 'values',
			[
				$("#slider").dragslider('option', 'values')[0] - STEP,
				$("#slider").dragslider('option', 'values')[1] - STEP
			]);
		}
	}
	
	if ( size ){
		STEP = t_step;
	}
	//console.log($("#slider").slider('option', 'values'));
}


//Handles slider actions
$(function() 
{
	//Gets information from slider after each move
	function update_slider(p1,p2)
	{
		//console.log($('#slider').slider('option', 'values'));
		
		//Positions of two sliders
		var p1 = $("#slider").children('.ui-slider-handle').first().offset();
		var	p2 = $("#slider").children('.ui-slider-handle').last().offset();
		//console.log(p1);
		var offset = [p1,p2];
		
		//Updates labels
		var value = $('#slider').dragslider('option', 'values'); 
		// $('.label1').html(value[0])
		// 	.css('left', offset[0].left)
		// 	//.css('top', offset[0].top)
		// 	.show();
		// $('.label2').html(value[1])
		// 	.css('left', offset[1].left)
		// 	//.css('top', offset[1].top)
		// 	.show();
		//$('#slider').html(value[1]);
		
		//Updates bottom text
		$('.slider-text#from').html(getTime(value[0]));
		$('.slider-text#to').html(getTime(value[1]));
		
		if ( $('#effin-graph > svg').length){
			viz = $('#effin-graph').data('viz');
			if ( !$('#effin-graph > svg > rect').length ){
				console.log(viz.options);
				var svgDocument = $('#effin-graph > svg')[0];
				var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
				rect.setAttributeNS(null, "x", 0)
				rect.setAttributeNS(null, "y", 0)
				rect.setAttributeNS(null, "width",  0)
				rect.setAttributeNS(null, "height",  0)
				rect.setAttributeNS(null, "fill", "#0ff")
				rect.setAttributeNS(null, "opacity", ".2")//stroke="black" stroke-width="2"
				rect.setAttributeNS(null, "stroke", "#000")
				rect.setAttributeNS(null, "stroke-width", "2");
				svgDocument.appendChild(rect);
			}
			width_mult = (viz.options.width-viz.options.padding)/$('#slider').dragslider('option', 'max');
			rect = $('#effin-graph > svg > rect');
			rect.attr('x', (parseInt(viz.options.padding) + 0 + parseInt(value[0])*width_mult));
			rect.attr('y', 0);
			rect.attr('width', (value[1]-value[0])*width_mult);
			rect.attr('height', viz.options.height-0-parseInt(viz.options.padding));
		}
		//console.log(value);
	}
	
	//Properties of the slider
	$("#slider").dragslider(
	{
		animate: true,		// If true breaks labels but looks pretty
		values: [12,24],	// Starting values
		step: STEP,
		range: true,		// Two slider handels
		rangeDrag: true,	// Allows for dragging of the middle slider section
		max: 288,
		min: 0,
		create: function(event, ui) //When slider is created
		{
			drawScale();
			update_slider();
		},
		start: function(event, ui)//When slider starts sliding
		{

		},
		change: function(event, ui) //When slider stops or value is changed programmatically
		{
			//console.log("change");
			update_slider();
			
			var value = $(this).dragslider('option', 'values'); 
			
			//update map
			window.vizMap.updateData(
									Math.floor(value[0]/12), ((value[0]-(Math.floor(value[0]/12)*12))*5), 
									Math.floor(value[1]/12), ((value[1]-(Math.floor(value[1]/12)*12))*5)
									);
			$.ajax({
				url: 'ajax/lang-count.php',
				dataType: 'json',
				data: {
						hs: Math.floor(value[0]/12),
						ms: ((value[0]-(Math.floor(value[0]/12)*12))*5),
						he: Math.floor(value[1]/12),
						me: ((value[1]-(Math.floor(value[1]/12)*12))*5)
				},
				success: function(rawData){
					
					//$('#pie').html("").d3InitPieGraph({languages: langs, data: rawData, width: 500, height: 600, radius: 250});
					
					/**
					if ( !rawData )
					return;
										
					total = 0;
					for (i = 0; i < rawData.length; i++)
						total += parseInt(rawData[i].data.count);
					// Make array of percentages representative of each language
					percentData = new Array();
					for (i = 0; i < rawData.length; i++)
						percentData[i] = parseInt(rawData[i].data.count)/total;

				    pieData = d3.layout.pie().sort(d3.descending);
				
				
				
					viz = $('#pie').data('viz');
					//viz.data(pieData).transition();
					viz.arcs.data(pieData).transition();
					viz.paths.data(pieData).transition();
					
					**/
				}
			});
		},
		stop: function(event, ui)//When slider stops
		{

		},
		slide: function(event, ui)//While slider is moving
		{
			update_slider();
		},
	});
});