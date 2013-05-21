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
		$.fancybox.resize();
    }

    function before_fancy_start(currentArray, currentIndex, currentOpts){
		var $x = $(currentArray[currentIndex]);
        var title = '<div id="title" data-key="' + $x.data("key") + '">'
				+ $x.data("tags").replace(',', '&nbsp;&nbsp;')
				+ '&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;'
				+ $x.data("title") + '</div>';
		$x.attr("title", title);
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
    
    function before_fancy_unload(x){
        $("#fancybox-wrap .edit").remove();
    }

    $(".body img").MyThumbnail(thumbnail_settings);
    $(".popup").fancybox({ onComplete:set_titles,
                           onCleanup:before_fancy_unload,
						   onStart:before_fancy_start});
    
    
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
			
			var id = $(e.target).data("key");
			var $x = $("#image-" + id);
			var tags = $x.data("tags").split(",");
			var name = $x.data("title");

			$(".edit").clone().insertAfter($("#fancybox-title"));
            $(".edit_tags").attr("value",tags.join(","));
            $("input[name='description']").attr("value", name);
            $("#fancybox-wrap input[name='id']").attr("value", id);
            $("#fancybox-wrap .edit .edit_tags").tokenField({regex:/.+/i});
			
			$.fancybox.resize();
        }
    });
    
    // fancy-box edit-mode tag-selection
    $("#fancybox-wrap").click(function(e){
        if(e.target.localName=="li" && e.target.id){
            $("#fancybox-wrap .token-input input")
				.attr("value", e.target.textContent)
				.blur();
        }
    });
    
    // fancy-box edit-mode submit-button
    $("#fancybox-wrap").click(function(e){
        if(e.target.id=="edit_submit"){

			var tags = $("#fancybox-wrap .edit input[name='tags']").val()
					.split(",");
			var name = $("#fancybox-wrap input[name='description']").val();
			var id = $("#title").data("key");
			var $x = $("#image-" + id);

            var title = tags.join(" ") + "  |  " + name;
            $.ajax({
                type: "POST",
                url: "/edit",
                data:$("input[name='csrfmiddlewaretoken'],#fancybox-wrap .edit input[name='tags'],#fancybox-wrap input[name='description'],#fancybox-wrap input[name='id']"),
            });

			$x.data({
				tags: tags.join(","),
				title: name
			});
            $("#fancybox-wrap .edit").remove();
            $("#title").text(title);

            fix_title_pos();
        }
    });
});

