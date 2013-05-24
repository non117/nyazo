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
		
		var edit_height = $("#fancybox-wrap .edit").height() || 0;

		$.fancybox.resize();

		if(edit_height != 0) $("#fancybox-wrap").stop(true, true);
		$("#fancybox-wrap")
			.animate({
				top: "-=" + edit_height + "px"
			}, 100);
    }

	// fancyboxのサムネイルが選択されてから、要素が追加されるまでに行う処理
	// 要素の生成前にやっておかなければならない処理
	//   タイトルの生成(タグ依存のため)
	//   次へ移動(画像なんて無かった)
    function before_fancy_start(currentArray, currentIndex, currentOpts){
		var $x = $(currentArray[currentIndex]);

		// key==-1 <=> 「次」
		if($x.data("key") == -1) { 
			var hasNext = "";

			// もし前の画像からの遷移で来たならば
			// 次のページには#nextをつける
			if($("#title").length != 0) {
				hasNext = "#next";
			}

			window.location = $x.attr("href") + hasNext;
			$.fancybox.close();
		} else {
			var title = '<div id="title" data-key="' + $x.data("key") + '">'
				+ $x.data("tags").replace(/,/g, '&nbsp;&nbsp;')
				+ '&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;'
				+ $x.data("title") + '</div>';
			$x.attr("title", title);
		}
    }

	// fancyboxによる拡大画像読み込み後の処理
	// 主にタイトルの作成を行う
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
                    data: "id=" + $("#title").data("key") + "&csrfmiddlewaretoken=" + $("input[name='csrfmiddlewaretoken']").val(),
                });
            }
        });

        fix_title_pos();
    }
    
	// fancybox: 次の画像とかで残ると困る物を削除
    function before_fancy_unload(x){
        $("#fancybox-wrap .edit").remove();
    }

    $(".body img").MyThumbnail(thumbnail_settings);
    $(".popup").fancybox({ onComplete:set_titles,
                           onCleanup:before_fancy_unload,
						   onStart:before_fancy_start});
    $(".popup-upload").fancybox();

    
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

			var left = ($("#fancybox-wrap").width() 
						- $(".edit").innerWidth())  / 2;
			$(".edit").clone()
				.css("margin-left", left)
				.insertAfter($("#fancybox-title"));
            $(".edit_tags").attr("value",tags.join(","));
            $("input[name='description']").attr("value", name);
            $("#fancybox-wrap input[name='id']").attr("value", id);
            $("#fancybox-wrap .edit .edit_tags").tokenField({regex:/.+/i});
			
			fix_title_pos();
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

	$('#taggit-start')
		.click(function(e){
			// まとめてなんとかぼたん〜
			$(".image-pic").each(function(i, e){
				var $this = $(e);

				$('<input type="checkbox" class="taggit" data-key="' + $this.data("key") + '">')
					.appendTo($this.find(".image"))
					.click(function(e){e.stopPropagation();});
			});
			$("#taggit-submit, #taggit-start").toggle();
		});
	$('#taggit-submit')
		.click(function(e){
			$(".taggit:checked").each(function(i,e){
				var $this = $(e).closest(".image-pic");

				var tags = $this.data("tags").split(",");
				tags = tags.concat($("#search_tag").val().split(","));
				tags = tags.filter(function(e){return !!e;});

				$.ajax({
					type: "POST",
					url: "/edit",
					data:{
						csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']").val(),
						tags: tags.join(","),
						id: $this.data("key"),
						description: $this.data("title")
					}
				});
				$this.data("tags", tags.join(","));
            });
			$(".taggit").remove();
			$("#taggit-submit, #taggit-start").toggle();
		});

	// D&Dに対応するよー
	var image_mime = ["image/png", "image/jpeg", "image/tiff"];
	function stop_bubble(e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
	$('html').on('dragover', stop_bubble);
	$('html').on('dragenter', stop_bubble);

	$("html").on("drop", function(e){
        stop_bubble(e);

		if(!e.originalEvent.dataTransfer 
		   || ! e.originalEvent.dataTransfer.files.length)
			return false;

        var files = e.originalEvent.dataTransfer.files;
		$("input[name='imagedata']")[0].files = files;
		
		$(".popup-upload").click();
		return false;
	});

	// reload/url直打ちによるfancybox強制オープン対策
	if(document.location.hash == "#next") {
		$(".image-pic:nth(0)").click();
		window.location.hash = "";
	}
});

