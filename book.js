var currentIndex = 0;

var content = document.getElementById('content');
var columnGap = 20;
var contentMargins = 2*16;
var pageWidth = document.body.clientWidth - contentMargins;
var maxIndex = 0;
var filename = location.href.substring(location.href.lastIndexOf('/')+1, location.href.lastIndexOf('.'));
if(content != null)
  maxIndex = Math.ceil((content.scrollWidth)/ (pageWidth + columnGap)) - 1;

function setPageCount(){
  var count = document.getElementById("pg-count");
  count.innerText = (currentIndex+1) + "/" + (maxIndex +1);
}

function goPage(){
    content.style.overflow = "auto";
    content.scrollLeft = (pageWidth + columnGap) * currentIndex  ;
    content.style.overflow = "hidden";
    
    setPageCount();
    localStorage.chapter = filename;
    localStorage.page = currentIndex;
}

function nextPage(){
  if(currentIndex < maxIndex){
    currentIndex++;
    goPage();
  }
  else{
    if(filename == "preface")
      location.replace("toc.html");
    else if(filename == "toc")
      location.replace("ch1.html");
    else if(filename.substring(0,2) == "ch"){
      var chapter = parseInt(filename.substring(2));
      if(chapter < 11)
        location.replace("ch" + ++chapter + ".html");
    }
  }
}

function prevPage(){
  if(currentIndex > 0){
    currentIndex--;
    goPage();
  }
  else{
    if(filename == "preface")
      location.replace("cybernetics.html");
    else if(filename == "toc")
      location.replace("preface.html");
    else if(filename.substring(0,2) == "ch"){
      var chapter = parseInt(filename.substring(2));
      if(chapter > 1)
        location.replace("ch" + --chapter + ".html");
      else if(chapter == 1)
      location.replace("toc.html");     
    }
  }  
}

function toc(){
  location.replace("toc.html");
}

function go(){
  if(localStorage.chapter == null)
    localStorage.chapter = "preface";
    
  location.replace(localStorage.chapter + ".html");
}

document.body.onload = function(){
  if(filename == localStorage.chapter && localStorage.page != undefined){
    currentIndex = parseInt(localStorage.page);
    goPage();
  }
};

document.body.addEventListener('touchmove', function(event){
  event.preventDefault();
});

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-141741-9', 'auto');
ga('send', 'pageview');
