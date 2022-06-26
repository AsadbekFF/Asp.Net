$(document).ready(function() {
	
	$( ".autoCompleteInput" ).keypress(function(event){
		if (event.keyCode == 13)
			event.preventDefault();
	});

	$( ".autoCompleteInput" ).autocomplete({
		source: '/service/schedule/search',
		minLength: 3,
		delay: 500,
		select: function( event, ui ) {
			location.href = '/service/schedule/' + ui.item.id + '/timetable';
			$(this).val('');
			event.preventDefault();
			return false;
		},
	})
	.autocomplete( "widget" ).addClass( "autoCompleteInput_menu" );
	$( ".autoCompleteInput" ).autocomplete( "instance" )._renderItem = function( ul, item ) {
		var substr_pos = item.label.toLowerCase().indexOf(this.term.toLowerCase());
		return $( "<li></li>" ) 
		.data( "item.autocomplete", item )
		.append( item.label.substring(0, substr_pos) )
		.append( '<span class="coincident_text">' + item.label.substring(substr_pos, this.term.length + substr_pos ) + '</span>' )
		.append( item.label.substring(substr_pos + this.term.length ) )
		.appendTo( ul );
    };
});