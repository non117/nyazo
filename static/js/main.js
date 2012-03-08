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
                $.ajax({
                    type: "POST",
                    url: "/delete",
                    data: "id=" + $("#title").attr("key") + "&csrfmiddlewaretoken=" + $("input[name='csrfmiddlewaretoken']").val(),
                });
            }
        });
    }
    
    $.autopager({
        content:".body",
        link:".next",
        load:function(){
            $(this[0].getElementsByTagName("a")).fancybox({
                                                    onComplete:delete_image,
                                                    onStart:function(){$("#fancybox-wrap .edit").remove();} 
                                                    });
            $(this[0].getElementsByTagName("img")).MyThumbnail(thumbnail_settings);
        }
    });
    $(".body img").MyThumbnail(thumbnail_settings);
    $(".popup").fancybox({ onComplete:delete_image, onStart:function(){$("#fancybox-wrap .edit").remove();} });
    
    
    
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
    
    $("#fancybox-wrap").click(function(e){
        if(e.target.getAttribute("id")=="title"){
            var title = $("#title").text().replace(/\s/g,",").replace(/,,/g,",").split("|");
            var id = $("#title").attr("key");
            $("#fancybox-title").after($(".edit").clone());
            $(".edit_tags").attr("value",title[0]);
            $("input[name='description']").attr("value", title[1].replace(/,/g,""));
            $("#fancybox-wrap input[name='id']").attr("value", id);
            $("#fancybox-wrap .edit .edit_tags").tokenField({regex:/.+/i});
        }
    });
    
    $("#fancybox-wrap").click(function(e){
        if(e.target.localName=="li" && e.target.id){
            $("#fancybox-wrap .token-input input").attr("value",e.target.textContent);
            $("#fancybox-wrap .token-input input").blur();
        }
    });
    
    $("#fancybox-wrap").click(function(e){
        if(e.target.id=="edit_submit"){
            var title = $("#fancybox-wrap .edit input[name='tags']").val().replace(/,/g," ") + 
                        "  |  " + $("#fancybox-wrap input[name='description']").val();
            $.ajax({
                type: "POST",
                url: "/edit",
                data:$("input[name='csrfmiddlewaretoken'],#fancybox-wrap .edit input[name='tags'],#fancybox-wrap input[name='description'],#fancybox-wrap input[name='id']"),
            });
            $("#fancybox-wrap .edit").remove();
            $("#title").text(title);
            $("#title")[0];
        }
    });
});

