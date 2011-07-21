(function($) {
	
	
	$.fn.d3InitEffingLineGraph = function(options) {
		
		
		var defaults = {
		   		languages: null,
		   		data: null,
		   		width: 850,
		   		height: 180,
		   		padding: 30,
				what: this.selector,
				self: this
		 		};
		
		var options = $.extend(defaults, options);
		
		
		function getYMax(d)//Gets the max y values across all languages to scale graph
		{
			max = 0;
			for (var i=0; i < d.length; i++) 
			{
				lm = 0;
				for(var j=0; j < d[i].length; j++){
					a = parseInt(d[i][j]);
					lm = lm<a?a:lm;
				}
				max = max<lm?lm:max;
			}
			return max;
		}
		
		function parseData(rawData) {
			var currentLang = rawData[0].lang, //the current language it is building the array for
				currentSlot = 0,//index of current array in data array
				min = 0,//current minute block 0-11
				hour = 0,//current hour
				minNum = 0,//number of minutes out of 288 minute day
				_langs = [rawData[0].lang], //list of the languages
				data = new Array();//where data goes

			data.push(new Array());//first sub array of data array
			dmap = new Object();
			dmap[''+currentSlot] = options.languages[currentLang];

			for (var i=0; i < rawData.length; i++) //for each json entry
			{
				if(currentLang != rawData[i].lang)//if there is a language change
				{
					currentLang = rawData[i].lang;
					while(minNum < rawData[1].length)//fill in rest of last language with zeros
					{
						data[currentSlot].push(0);
						minNum++;
					}
					_langs.push(rawData[i].lang);
					data.push(new Array());//array for next language
					currentSlot++;
					minNum = 0;
					hour = 0;
					min = 0;
				}
				while((min != rawData[i].minute) && (hour != rawData[i].hour) && (minNum < rawData[1].length))//fills in missing time periods with 0s
				{
					data[currentSlot].push(0);
					minNum++;
					min ++;
				  	if(min > 11)//rollover to next hour
				  	{
				  		hour++;
				  		min = 0;
				  	}
				}
				dmap[''+currentSlot] = options.languages[currentLang];
			  	data[currentSlot].push(rawData[i].cnt);//if current time is in the raw data put number of tweets in current lang array
			  	minNum++;
			  	min ++;
			  	if(min > 11)//rollover to next hour
			  	{
			  		hour++;
			  		min = 0;
			  	}
			}
			return {d:data,m:dmap};
		}
		
		return this.each(function() { 
			obj = $(this); 
			data_comb = parseData(options.data);
			dmap = data_comb.m;
			ddata = data_comb.d

			x = d3.scale.linear().domain([0, ddata[0].length]).range([0 + options.padding, options.width - options.padding]),//sets scale
		    y = d3.scale.linear().domain([0, getYMax(ddata)]).range([0 + options.padding, options.height - options.padding]);
				
			// Create the d3 object
			obj.vis = d3.select(options.what)
						.append("svg:svg")
						.attr("width",options.width)
						.attr("height",options.height);
			obj.vis.options = options;
				
			obj.g = obj.vis.append("svg:g")
						.attr("transform","translate(0,"+options.height+")");
						
			obj.line = d3.svg.line()//helper function to create line
						.x(function(d,i){return x(i);})
						.y(function(d){return -1 * y(d);})//-1 to account for translation

			for (var i=0; i < ddata.length; i++) //adds line for each language
			{
				obj.g.append("svg:path")
						.attr("d", obj.line(ddata[i]))
						.attr('class', 'lang-line')
						.attr('id', 'lang-line-'+dmap[''+i].abbr)
						.attr('lang', ''+dmap[''+i].abbr)
						.style("stroke",dmap[''+i].color.replace("#", ""))
						.on("mouseover", function(d,j) { 
							brushLang($(this).attr('lang'));
						}) // sets the tooltip to visible
						.on("mouseout", function(d,j) {
							unBrush($(this).attr('lang'));
						}); // sets the tooltip to visible
			};
			
			obj.g.append("svg:line")//x axis
					.attr("x1", x(0))
					.attr("y1", -1 * y(0))
					.attr("x2", x(options.width))
					.attr("y2", -1 * y(0))
					.style("stroke",'#fff');;

			obj.g.append("svg:line")//y axis
					.attr("x1", x(0))
					.attr("y1", -1 * y(0))
					.attr("x2", x(0))
					.attr("y2", -1 * y(getYMax(ddata)))
					.style("stroke",'#fff');;
			
			obj.g.selectAll(".yLabel")//y axis labels
					.data(y.ticks(4))
					.enter().append("svg:text")
					.text(String)
					.attr("x", 4)
					.attr("y", function(d) { return -1 * y(d) })
					.attr("text-anchor", "right")
					.attr('color', '#fff')
					.attr('stroke', '#fff')
					.attr("dy", 4);
			obj.data('viz',obj.vis);
			
			
			drawSliderHilight();
		});
		
		
		function drawSliderHilight(){
			if ( $('#effin-graph > svg').length){
				viz = $('#effin-graph').data('viz');
				if ( !$('#effin-graph > svg > rect').length ){
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
				value = $('#slider').dragslider('option', 'values'); 
				width_mult = (viz.options.width-viz.options.padding)/$('#slider').dragslider('option', 'max');
				rect = $('#effin-graph > svg > rect');
				rect.attr('x', (parseInt(viz.options.padding) + 0 + parseInt(value[0])*width_mult));
				rect.attr('y', 0);
				rect.attr('width', (value[1]-value[0])*width_mult);
				rect.attr('height', viz.options.height-0-parseInt(viz.options.padding));
			}
		}
		
		
		this.ddata = ddata;
		
		
	};
})(jQuery);




	function colorKey()
	{
		for(var i=0; i < langs.length; i++) 
		{
	  	$("#langColor").html($("#langColor")
	  		.html() + "<div id='lang" + i +"'>" + _langs[i] + "</div>");
	
		$("#lang"+i)
			.css("color",colors[i]);
		}
	}
