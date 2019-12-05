

/*
 * Parses the Asset.xcassets asset folder in same directory
 * Generates a html file with the colors and images displayed
 * Also some helping variables for Sass
 */

var globalflattxt = "";
var globallistindex = "";
var globalflatSassNormal = "";
var globalflatSass = "";

var header = `
<meta charset='UTF-8'>
<meta http-equiv='X-UA-Compatible' content='IE=edge'>
<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'>
<title>Assets xcassets parser</title>
<link href="https://fonts.googleapis.com/css?family=Roboto:400,500,700&display=swap" rel="stylesheet">
<style type='text/css'>
body {
    margin: 0;
    padding: 0;
    font-size: 12pt;
    font-family: Arial, sans-serif;
}
.header-logo {
    font-size: 18pt;
}
.header {
    padding: 1vh 1vw;
}
.conf-container {
    padding: 1vh 1vw;
    background: #e8e8e8;
}
.json-pre {
    white-space: pre-wrap;
    background: #f1f1f1;
}
.colorbox--white {
    display: inline-block;
    padding: 5px;
    background: white;
    border: 1px solid grey;
    border-radius: 2px;
}
.colorbox--black {
    display: inline-block;
    padding: 5px;
    background: black;
    border: 1px solid grey;
    border-radius: 2px;
}
.colorblock {
    display: inline-block;
    padding: 5px;
}
img {
    max-width: 14vw;
}
</style>
`;

var prebody = `
<header class="header">
    <div class="header-logo">
        Assets
    </div>
</header>
`;

//===================================================
// Assets

function allKeys(object) {
    return Object.keys(object).reduce((keys, key) =>
        keys.concat(key,
            typeof object[key] === 'object' ? allKeys(object[key]) : []
        ),
        []
    );
}

function hasP(obj, param)
{
    if(param)
    {
        if(obj.hasOwnProperty(param))
        {
            return obj[param];
        }
        else
        {
            return false;
        }
    }
    else
    {
        return false;
    }
}

function isHex(h)
{
    var a = parseInt(h,16);
    if(h == 'undefined')
    {
        return false;
    }
    return (a.toString(16) === h.toLowerCase())
}

function colorConv(rawColor)
{
    if(isHex(rawColor))
    {
        rawColor = parseInt(rawColor, 16);
        return Math.round(rawColor / 255, 3);
    }
    else
    {
        if(rawColor == "0.000")
        {
            return 0;
        }
        return Math.round((255) * rawColor, 3);
    }
}

var parseContentsJson = function(content, dirName)
{
    var valuName = dirName.split("/");
    let mash = "";
    try {
        if(content)
        {
            if(hasP(content, "colors"))
            {
                content.colors.forEach(function(item)
                {
                    var rawAppearenceLast = "normal";
                    if(appearances = hasP(item, "appearances"))
                    {
                        if(appearances.length != 0)
                        {
                            appearances.forEach(function(ap) {
                                mash += `Appearances: ` + ap.appearance + `, ` + ap.value + `<br/>`;
                                rawAppearenceLast = ap.value;
                            });
                        }
                    }

                    if(color = hasP(item, "color"))
                    {
                        if(hasP(color.components, "white"))
                        {
                            let tmp = `rgba(`
                                + colorConv(color.components.white) + `,`
                                + colorConv(color.components.white) + `,`
                                + colorConv(color.components.white) + `,`
                                + color.components.alpha + `)`;

                            mash += `<span class='colorbox--black'><span class='colorblock' style='background-color: ` + tmp + `'>` + item.idiom + ` ` + tmp + `</span></span>`;
                            mash += `<span class='colorbox--white'><span class='colorblock' style='background-color: ` + tmp + `'>` + item.idiom + ` ` + tmp + `</span></span><br/>`;

                            if(rawAppearenceLast == "normal")
                            {
                                globalflatSassNormal += "$" + valuName[2].replace('.', '').replace('colorset', '') + "" + ": " + tmp + ";\n";
                            }
                            else {
                                globalflatSass += "$" + valuName[2].replace('.', '').replace('colorset', '') + "" + ": " + tmp + ";\n";
                            }
                        }
                        else
                        {
                            let tmp = `rgba(`
                                + colorConv(color.components.red) + `,`
                                + colorConv(color.components.green) + `,`
                                + colorConv(color.components.blue) + `,`
                                + color.components.alpha + `)`;

                            mash += `<span class='colorbox--black'><span class='colorblock' style='background-color: ` + tmp + `'>` + item.idiom + ` ` + tmp + `</span></span>`;
                            mash += `<span class='colorbox--white'><span class='colorblock' style='background-color: ` + tmp + `'>` + item.idiom + ` ` + tmp + `</span></span><br/>`;

                            if(rawAppearenceLast == "normal")
                            {
                                globalflatSassNormal += "$" + valuName[2].replace('.', '').replace('colorset', '') + "" + ": " + tmp + ";\n";
                            }
                            else {
                                globalflatSass += "$" + valuName[2].replace('.', '').replace('colorset', '') + "" + ": " + tmp + ";\n";
                            }
                        }
                    }
                    console.log(mash);
                })
            }
        }
    } catch(err) {
        console.log("Error parsing:", err);
    }

    return mash;
}

// List all files
var walkSync = function(dir, filelist)
{
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file)
    {
        if (fs.statSync(dir + '/' + file).isDirectory())
        {
            globalflattxt += '\t\t<li class="list--headline"><a id="tag_' + file + '"></a><h3>' + file.replace('-', ' ') + '</h3></li>\n';
            globallistindex +=  '\t\t<li class="list--hline"><a href="#tag_' + file + '"><span>' + file.replace('-', ' ') + '</span></a></li>\n';
            filelist.push(walkSync(dir + '/' + file, []));
        }
        else if (file.indexOf(".json") > -1)
        {
            filelist.push(dir+'/'+file);
            let filePath = dir+'/'+file;
            let fileContent = {};
            try
            {
                let rawdata = fs.readFileSync(filePath);
                fileContent = JSON.parse(rawdata);
                fileContentParsed = parseContentsJson(fileContent, dir);
            }
            catch(err)
            {
                console.log("error parse: ", err);
            }

            globalflattxt += `\t\t<li><span class="list-item-filename">` + file + `</span><br/>
                            ` + fileContentParsed + `
                            <pre class='json-pre'>` + JSON.stringify(fileContent) + `</pre></li>\n`;
        }
        else if (file == ".DS_Store")
        {

        }
        else
        {
            filelist.push(dir+'/'+file);
            globalflattxt += '\t\t<li><img src="'+dir+'/'+file+'" > <br/><span class="list-item-filename">'+file + '</span></li>\n';
        }
    });
    return filelist;
};


function buildHtml() {

    var body = '';

    var list = walkSync('./Assets.xcassets', []);

    body += `
    <div class='conf-container'>

    </div>
    <div class='conf-container'>
    `

    body += "\t<ul class='list-index'>\n";
    body += globallistindex;
    body += "\t</ul>\n";

    body += "\t<ul class='list-assets'>\n";
    body += globalflattxt;
    body += "\t</ul>\n";

    body += "\t<hr/>\n<h3>// Normal</h3><br/><pre>\n";
    body += globalflatSassNormal;
    body += "\t</pre>\n";

    body += "\t<hr/>\n<h3>// Dark</h3><br/><pre>\n";
    body += globalflatSass;
    body += "\t</pre>\n";

    body += `
    </div>
    <div class='conf-container'>

    </div>
    `

    return '<!DOCTYPE html>'
        + '<html><head>' + header + '</head><body>' + prebody + body + '</body></html>';
};

var fs = require('fs');

var fileName = './index.html';
var stream = fs.createWriteStream(fileName);

stream.once('open', function(fd) {
    var html = buildHtml();

    stream.end(html);
});