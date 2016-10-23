$(function () {

	$(".inline-next-form").css({
		"width":  ($(".inline-next-form").find("input").length * 100) + "%"
	});
	$(".inline-next-form>input").on('change', function(){
		var input = $(this);
		
		if ($(this).index() === $(this).parent().children().length - 2){
			$(this).parent().parent().submit();
		} else {
			$(this).parent().css({
				"left":  (-(1 + $(this).index()) * 100) + "%"
			});
			setTimeout(function(){
				$(input).nextAll("input").first().focus();
			}, 650);
		}

	});
});