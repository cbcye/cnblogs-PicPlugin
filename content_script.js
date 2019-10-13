/********************************************************************************
** 作者： 在路上的张(www.cnblogs.com/gotop)
** 创始时间：2016-6-12
** 描述：
**    chrome插件网页内容注入文件
*********************************************************************************/
var editorText = '';
//var editorHTML = '';
var downimgCount = 0;
var updateImgCount = 0;

$(function () {
    var syncPicUrl = chrome.extension.getURL('sync.png');
    $("#edit_body_tip").after("<div id='uploadOutPic' style='line-height:30px;float:clear;'><img src='" + syncPicUrl + "' title='点击同步外部图片' align='left' width='30' height='30'/><span>点击同步外部图片，非Markdown编辑器请先保存内容再编辑和同步</span></div>");
    $("#uploadOutPic").click(function () {
        downimgCount=0;
        updateImgCount=0;
        //alert("点击了图片");
        $("#uploadOutPic span").text("开始同步，请稍等...");
        editorText = $("#edit_body textarea").val();
        if(null == editorText || '' == editorText ){
            editorText = $("#Editor_Edit_EditorBody_ifr").contents().find("body").html();
        }
        //editorHTML = $("#Editor_Edit_EditorBody_ifr").contents().find("body").html();
        GetMarkDownPic(editorText);
    });
    chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type == "downComplete") {
            upload(request.response, request.filename, request.url)
            sendResponse({ msg: "receive file complete" });
        }
        else if(request.type=="replaceText")
        {
            ReplaceEditor(request.oldurl, request.newurl);
            sendResponse({ msg: "receive replaceText command" });
        }
    });
});

function GetMarkDownPic(md)
{

    str = md;
    //Markdown Pattern
    var MarkDownpattern = /!\[(\S*)\]\((\S*)/g;
    var HTMLpattern = /<img.*src="(http|https:\/\/[^"']*)"/g;
    //var imgPattern = /\((http|https:\/\/\S*)\)/;
    

    if(null != str.match(MarkDownpattern)){
        arr = str.match(MarkDownpattern);
    } else if(null != str.match(HTMLpattern)) {
        arr = str.match(HTMLpattern);
    }
    else{
        alert("文章内容为空或未找到图片，如使用非Markdown编辑器请先保存文章。再点击重试"); return 0
    };


    var imgPattern = /((http|https):\/\/[^)|^"|^']*)/;

    if(null != arr){
    downimgCount = arr.length;
    for (var i = 0; i <= arr.length; i++) {
        var item = arr[i];
        if (item != null) {
            var img = item.match(imgPattern);
            var remoteImage = img[1];
            if(remoteImage.indexOf('cnblogs.com') > 0){
                console.log("[skip] "+remoteImage);
                continue;
            } 
            //向background.js发送下载文件请求
            chrome.extension.sendMessage({ type: "downfile",file:remoteImage }, function (response) {
            console.log(response.msg);
            });
        }
    }
    }

}
function ReplaceEditor(oldUrl,newUrl)
{
    console.log("oldUrl:" + oldUrl);
    console.log("newUrl:" + newUrl);
    editorText= editorText.replace(oldUrl, newUrl);

    //if(null != editorHTML) {editorHTML = editorHTML.replace(oldUrl, newUrl);}

    updateImgCount++;
    if(updateImgCount>=downimgCount)
    {
        $("#edit_body textarea").val(editorText);
        var editorHTML = $("#Editor_Edit_EditorBody_ifr").contents().find("body").html();
        if(null != editorHTML) {$("#Editor_Edit_EditorBody_ifr").contents().find("body").html(editorText);}

        $("#uploadOutPic span").text("同步完成，单击重新同步，如同步失败请保存再编辑和同步。");
    }
}