$(document).ready(function() {
	
	$( ".dept" ).click(function(e, x){
		var prt = $(this).parent("dt");
		prt.toggleClass('selected');
	});
	
	var hash = window.location.hash.substring(1);
	if ( hash ) {
		var prt = $("dt[rel=" + hash + "]");
		prt.toggleClass('selected');
	}
	
});