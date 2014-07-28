function searchInList (event){
	var searchString = document.getElementById("search").value.toLowerCase();
	var lis = document.getElementById("items").getElementsByTagName("li");
    for (i = 0; i < lis.length; i++) {
    	var li = lis[i];
    	var liText = li.getElementsByTagName("h4")[0].innerHTML.toLowerCase();
    	alert(liText.indexOf(searchString) > -1);
    	if(liText.indexOf(searchString) > -1) {
	    	li.removeAttribute("hidden");
    	} else {
    		li.setAttribute("hidden", "");
    	}
	}
}