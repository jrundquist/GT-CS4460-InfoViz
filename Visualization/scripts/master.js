// Define the language settings/key
var langs = {
	"en":
		{	
			"color":"#00FFFF",	// Teal
			"name" :"English",
			"abbr" :"en"
		},
	"ja":
		{
			"color":"#2FDB00",	// Green
			"name" :"Japanese",
			"abbr" :"ja"
		},
	"ko":
		{
			"color":"#FF0000",	// Red
			"name" :"Korean",
			"abbr" :"ko"
		},
	"pt":
		{
			"color":"#CCF600",	// Yellow
			"name" :"Portuguese",
			"abbr" :"pt"
		},
	"es":
		{
			"color":"#A600A6",	// Brown
			"name" :"Spanish",
			"abbr" :"es"
		},
	"fr":
		{
			"color":"#E586D6",	//	Pink
			"name" :"French",
			"abbr" :"fr"
		},
	"de":
		{
			"color":"#FFFFFF",	//	Light Blue
			"name" :"German",
			"abbr" :"de"
		},
	"tr":
		{
			"color":"#6B8FD4",	//	Orange
			"name" :"Turkish",
			"abbr" :"tr"
		},
	"ru":
		{
			"color":"#36D88A",	//	White
			"name" :"Russian",
			"abbr" :"ru"
		},
	"it":
		{
			"color":"#FF9200",	//	Purple
			"name" :"Italian",
			"abbr" :"it"
		}
};





function togglePlaying(){
	current = $('#play-pause').attr('playing');
	
	if ( current == 'true' ){
		$('#play-pause').attr('playing', false).html("Play");
	}else{
		$('#play-pause').attr('playing', true).html("Pause");
		mapPlay();
	}
	
}




function mapPlay(){
	can_play = $('#play-pause').attr('playing');
	if ( can_play == 'true' ){		
		slider = $("#slider");
		vals = slider.dragslider("option", "values");
		vals[1] = vals[0]+12;
		diff = vals[1]-vals[0];
		max = slider.dragslider('option', 'max');
		
		if ( vals[1]+6 > max ){
			slider.dragslider('option', 'values', [0, diff]);
		}else{
			slider.dragslider('option', 'values', [(vals[0]+6), (vals[1]+6)]);
		}
		setTimeout('mapPlay()', 500);
	}
	
}


function brushLang(lang){

	$('path.pie-piece').each(function(){
		if ($(this).attr('id') != 'pie-piece-'+lang){
			$(this).stop().animate({opacity: 0.25, strokeWidth: 1.5}, 1000);
		}
	});
	
	$('path.lang-line').each(function(){
		if ($(this).attr('id') != 'lang-line-'+lang){
			$(this).stop().animate({opacity: 0.25, strokeWidth: 1.5}, 1000);
		}
	});
	
	// d3.select('#lang-line-'+lang).transition().duration(0)
	// 	.attr("stroke-width", "10.0");
	$('#pie-piece-'+lang).stop().animate({opacity: 1, strokeWidth: 6}, 1000).attr('stroke', '#fff');

	$('#lang-line-'+lang).stop().animate({opacity: 1.5, strokeWidth: 6},1000);
}

function unBrush(lang){
	
	$('path.pie-piece').each(function(){
		if ($(this).attr('id') != 'pie-piece-'+lang){
		
			$(this).stop().animate({opacity: 1, strokeWidth: 1.5}, 1000);
		}
	});
	
	
	$('path.lang-line').each(function(){
		if ($(this).attr('id') != 'pie-piece-'+lang){
		
			$(this).stop().animate({opacity: 1, strokeWidth: 1.5}, 1000);
		}
	});


	$('#pie-piece-'+lang).stop().animate({opacity: 1, strokeWidth: 0}, 1000);


	$('#lang-line-'+lang).stop().animate({opacity: 1, strokeWidth: 1.5},1000);

}







