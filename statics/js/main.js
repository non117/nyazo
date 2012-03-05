$(function(){
    var thumbnail_settings = {
        thumbWidth:150,
        thumbHeight:150,
        backgroundColor:"#ccc",
        imageDivClass:"image"
    }
    
    function delete_image(){
        $("#fancybox-title-float-right").append('<a id="delete" style="display: inline; "></a>');
        $("#delete").click(function(){
            if(window.confirm("本当に削除しますか？")){
                $(this).load("/delete?name="+$("#fancybox-img").attr("src"));
                location.reload();
            }
        });
    }
    
    $.autopager({
        content:".body",
        link:".next",
        load:function(){
            $(this[0].getElementsByTagName("a")).fancybox({ onComplete:delete_image });
            $(this[0].getElementsByTagName("img")).MyThumbnail(thumbnail_settings);
        }
    });
    $(".body img").MyThumbnail(thumbnail_settings);
    $(".popup").fancybox({ onComplete:delete_image });
    
    
    
    $(".tags").tokenField({regex:/.+/i});
    
    $("#upload .alltag li").click(function(){
        $(".token-input input").attr("value",$(this).text());
        $(".token-input input").blur();
    });
    
    $("#header .alltag li").click(function(){
        if($(this).hasClass("search")){
            $(this).attr("style","background-color:#ECEEF5;");
            $(this).removeClass("search");
            $("#search_tag").val($("#search_tag").val().replace("," + $(this).attr("tag"),""));
        }else{
            $(this).attr("style","background-color:#CAD4E7;");
            $(this).addClass("search");
            $("#search_tag").val($("#search_tag").val() + "," + $(this).attr("tag"));
        }
    });
    
});

