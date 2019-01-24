exports.makeModification = function(options) {

	if (options) {
		var modification_name = (options.hasOwnProperty('modification_name')) ? options['modification_name'] : 'test';
		var author = (options.hasOwnProperty('author')) ? options['author'] : 'Author';
		var link = (options.hasOwnProperty('link')) ? options['link'] : '';
		var version = (options.hasOwnProperty('version')) ? options['version'] : '0.1';
		var modification_path = (options.hasOwnProperty('modification_path')) ? options['modification_path'] : './';
	} else {
		var modification_name = 'test';
		var author = 'Author';
		var link = '';
		var version = '0.1';
		var modification_path = './';
	}

	var fs = require('fs');
	var path = require('path');
	"use strict";

	var filt = new RegExp('//-nmn '+modification_name+' pos:"(.*)" line: (.*)[\r\n|\r|\n]([\\s\\S]*?)//-nmn', 'gmu');
	var filt_html = new RegExp('<!--//-nmn '+modification_name+' pos:"(.*)" line: (.*)-->([\\s\\S]*?)<!--//-nmn-->', 'gmu');

	var write_filename = modification_path + modification_name+'.ocmod.xml';

	function writeModificationFileStart() {
		var start_string = `<?xml version="1.0" ?>
<!DOCTYPE modification []>
<modification>
	<name>`+modification_name+`</name>
	<version>`+version+`</version>
	<author>`+author+`</author>
	<link>`+link+`</link>
	<code>`+modification_name+`</code>`;
		fs.writeFileSync(write_filename, start_string, function(err){
			if (err) throw err;
		});
	}

	function writeModificationFileEnd() {
		var end_string = `
</modification>`;
		fs.appendFileSync(write_filename, end_string, function(err){
			if (err) throw err;
		});
	}

	function writeModificationFile(filename, modifications_array) {
		var data = '';

		for (var key in modifications_array) {
			if (modifications_array.hasOwnProperty(key)) {
				if ( modifications_array[key][0] !== undefined
					&& modifications_array[key][1] !== undefined
					&& modifications_array[key][2] !== undefined
					&& modifications_array[key][3] !== undefined
				) {
					data += `	
	<file path="`+key.replace(/\\/g, '/').replace(/theme\/(.*)\/template/g, 'theme/*/template')+`">
		<operation>
			<search><![CDATA[`;
					data += modifications_array[key][3];
					data += `]]></search>
			<add position="`+modifications_array[key][2]+`"><![CDATA[`;
					data += modifications_array[key][1];
					data += `]]></add>
		</operation>
	</file>`;
					data+='\n';
				}
			}
		}

		fs.appendFileSync(write_filename, data, function(err){
			if (err) throw err;
		});
	}

	// https://stackoverflow.com/questions/25460574/find-files-by-extension-html-under-a-folder-in-nodejs/25462405#25462405
	function fromDir(startPath, filter, filelist){
		if (!fs.existsSync(startPath)){
			console.log("no dir ",startPath);
			return;
		}
		filelist = filelist || [];
		var files=fs.readdirSync(startPath,{'withFileTypes':true});
		for(var i=0;i<files.length;i++){
			var filename=path.join(startPath,files[i]);
			var stat = fs.lstatSync(filename);
			if (stat.isDirectory()){
				fromDir(filename,filter,filelist);
			}
			else if (filename.indexOf(filter)>=0) {
				filelist.push(filename);
			}
		}
		return filelist;
	}

	// TODO: Refactor
	var file_list_php = fromDir('./catalog/','.php');
	var file_list_tpl = fromDir('./catalog/','.tpl');
	var file_list_twig = fromDir('./catalog/','.twig');
	var admin_file_list_php = fromDir('./admin/','.php');
	var admin_file_list_tpl = fromDir('./admin/','.tpl');
	var admin_file_list_twig = fromDir('./admin/','.twig');

	function findMatch(list, filter) {
		for (var i=0; i<list.length; i++) {
			(function(filename){
				console.log('Searching in ' + filename);
				var contents = fs.readFileSync(filename);
				var modifications;
				var match;
				while ((match = filter.exec(contents)) !== null) {
					modifications = [];
					modifications[filename] = [];
					modifications[filename].push(match['index'], match[3], match[1], match[2]);
					writeModificationFile(filename, modifications);
				}

			})(list[i]);
		}
	}

	writeModificationFileStart();
	findMatch(file_list_php, filt);
	findMatch(file_list_tpl, filt_html);
	findMatch(file_list_twig, filt_html);
	findMatch(admin_file_list_php, filt);
	findMatch(admin_file_list_tpl, filt_html);
	findMatch(admin_file_list_twig, filt_html);
	writeModificationFileEnd();
};