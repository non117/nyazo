$(function(){
    $.autopager({
        content:".body",
        link:".next",
        load:function(){
            $(this[0].getElementsByTagName("a")).fancybox({onComplete:delete_image});
            $(this[0].getElementsByTagName("img")).MyThumbnail({
                thumbWidth:150,
                thumbHeight:150,
                backgroundColor:"#ccc",
                imageDivClass:"image"
            });
        }
    });
    $(".body img").MyThumbnail({
        thumbWidth:150,
        thumbHeight:150,
        backgroundColor:"#ccc",
        imageDivClass:"image"
    });
    $(".popup").fancybox({
        onComplete:delete_image
    });
    
    function delete_image(){
        $("#fancybox-title-float-right").append('<a id="delete" style="display: inline; "></a>');
        $("#delete").click(function(){
            if(window.confirm("本当に削除しますか？")){
                $(this).load("/delete?name="+$("#fancybox-img").attr("src"));
                location.reload();
            }
        });
    }
    
    
    $(".tags").tokenField({regex:/.+/i});
    
    $(".alltag li").click(function(){
        $(".token-input input").attr("value",$(this).text());
        $(".token-input input").blur();
    });
});