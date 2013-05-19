$(function(){
    var thumbnail_settings = {
        thumbWidth:150,
        thumbHeight:150,
        backgroundColor:"#ccc",
        imageDivClass:"image"
    };
    
    // タイトル位置を画面中央に補正
    function fix_title_pos() {
        var left = ($("#fancybox-wrap").innerWidth()
                    - $("#fancybox-title").innerWidth()
                    - $("#delete").innerWidth()) / 2;
        $("#fancybox-title").css("left", left);
    }

    function set_titles(){
        // コピペボタン(Avocado button)
        var avocado = '<td><div id="copybutton"><script type="text/javascript">\
                        swfobject.embedSWF(static_url + "/copybutton/CopyButton.swf","copybutton","24","24","9.0.0",null,\
                        {copyText:$("#fancybox-img").attr("src")},{wmode:"transparent"});</script></div></td>';
        $("#fancybox-title-float-left").before(avocado);

        //delete button
        $("#fancybox-title-float-right").after('<td id="delete"></td>');
        $("#delete").click(function(){
            if(window.confirm("本当に削除しますか？")){
                $.ajax({
                    type: "POST",
                    url: "/delete",
                    data: "id=" + $("#title").attr("key") + "&csrfmiddlewaretoken=" + $("input[name='csrfmiddlewaretoken']").val(),
                });
            }
        });

        fix_title_pos();
    }
    
    function before_fancy_load(x){
        $("#fancybox-wrap .edit").remove();
    }

    $(".body img").MyThumbnail(thumbnail_settings);
    $(".popup").fancybox({ onComplete:set_titles,
                           onCleanup:before_fancy_load });
    
    
    $(".tags").tokenField({regex:/.+/i});
    
    $("#upload .alltag li").click(function(){
        $(".token-input input").attr("value", $(this).text());
        $(".token-input input").blur();
    });
    
    // ミニタグクラウド
    $("#header .alltag li").click(function(){
        var tag = $(this).attr("tag");
        var val = $("#search_tag").val();

        if($(this).hasClass("search")) {
            val = val.replace("," + tag, "");
        } else {
            val = val + "," + tag;
        }
        $("#search_tag").val(val);

        $(this).toggleClass("search");
    });
    
    // fancy-box view-mode title-button
    $("#fancybox-wrap").click(function(e){
        if(e.target.getAttribute("id")=="title"){
            if($("#fancybox-wrap .edit").length != 0)
                return;

            var title = $("#title").text().replace(/\s/g,",").replace(/,,/g,",").split("|");
            var id = $("#title").attr("key");
            $("#fancybox-title").after($(".edit").clone());
            $(".edit_tags").attr("value",title[0]);
            $("input[name='description']").attr("value", title[1].replace(/,/g,""));
            $("#fancybox-wrap input[name='id']").attr("value", id);
            $("#fancybox-wrap .edit .edit_tags").tokenField({regex:/.+/i});
        }
    });
    
    // fancy-box edit-mode tag-selection
    $("#fancybox-wrap").click(function(e){
        if(e.target.localName=="li" && e.target.id){
            $("#fancybox-wrap .token-input input").attr("value",e.target.textContent);
            $("#fancybox-wrap .token-input input").blur();
        }
    });
    
    // fancy-box edit-mode submit-button
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

            fix_title_pos();
        }
    });
});

