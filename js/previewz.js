function readURL(input)
{
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#blah').attr('src', e.target.result);
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#imgInp").change(function()
{
    readURL(this);
});

$(function()
{
    $("#textprev").on("change", function()
    {
        $("#blah").prop("src", $(this).val());
    });

    $("#upload_img_button").click(function(e)
    {
        e.preventDefault();
        if($("#textprev").val().length > 0)
        {
            var imgUrl = uploadImgur($("#textprev").val());
            if(imgUrl.length > 0)
            {
                saveImgUrlToDatabase(imgUrl);
                var tags = parseTags($("#tag_box").val());
                var title = $("#title_box").val();
                saveImgMetaData(imgUrl, tags, title);
            }
            else
            {
                console.log("imgurl is blank!");
                console.log(imgUrl);
            }
        }
    });
});