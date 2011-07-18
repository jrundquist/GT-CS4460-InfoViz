(function($) {
	
	
	$.fn.d3InitEffingLineGraph = function(options) {
		
		
		var defaults = {
		   		languages: null,
		   		data: null,
		   		width: 850,
		   		height: 180,
		   		padding: 25,
				what: this.selector
		 		};
		
		var options = $.extend(defaults, options);
		
		
		function getYMax(d)//Gets the max y values across all languages to scale graph
		{
			var maxList = [];
			if (!d) return 0;
			for (var i=0; i < d.length; i++) 
			{
				maxList.push(d3.max(d[i]));
			}
			return d3.max(maxList);
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
					while(minNum < 288)//fill in rest of last language with zeros
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
				while((min != rawData[i].minute) && (hour != rawData[i].hour) && (minNum < 288))//fills in missing time periods with 0s
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
			this.vis = d3.select(options.what)
						.append("svg:svg")
						.attr("width",options.width)
						.attr("height",options.height);
				
			this.g = this.vis.append("svg:g")
						.attr("transform","translate(0,"+options.height+")");
						
			this.line = d3.svg.line()//helper function to create line
						.x(function(d,i){return x(i);})
						.y(function(d){return -1 * y(d);})//-1 to account for translation

			for (var i=0; i < ddata.length; i++) //adds line for each language
			{
				this.g.append("svg:path")
						.attr("d", this.line(ddata[i]))
						.style("stroke",dmap[''+i].color.replace("#", ""));
			};
			
			this.g.append("svg:line")//x axis
					.attr("x1", x(0))
					.attr("y1", -1 * y(0))
					.attr("x2", x(options.width))
					.attr("y2", -1 * y(0));
			
			this.g.append("svg:line")//y axis
					.attr("x1", x(0))
					.attr("y1", -1 * y(0))
					.attr("x2", x(0))
					.attr("y2", -1 * y(getYMax(ddata)));
			
			this.g.selectAll(".yLabel")//y axis labels
					.data(y.ticks(4))
					.enter().append("svg:text")
					.text(String)
					.attr("x", 0)
					.attr("y", function(d) { return -1 * y(d) })
					.attr("text-anchor", "right")
					.attr("dy", 4);
		});
		
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
