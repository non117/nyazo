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

		if(edit_height != 0) {
            $("#fancybox-wrap").stop(true, true);
        }
		$("#fancybox-wrap").animate({
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
			var title = ['<div id="title">' , $x.data("title"), '</div>'].join("");
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

        fix_title_pos();
    }
    	
	// fancybox: 起動
    $(".body img").MyThumbnail(thumbnail_settings);
    $(".popup").fancybox({ onComplete:set_titles,
						   onStart:before_fancy_start});

	// reload/url直打ちによるfancybox強制オープン対策
	if(document.location.hash == "#next") {
		$(".image-pic:nth(0)").click();
		window.location.hash = "";
	}
});

