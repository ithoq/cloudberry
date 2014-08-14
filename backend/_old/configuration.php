<?php
	$CONFIGURATION = array(
		"no_udev_random" => TRUE,
		"debug" => TRUE,
		"email_login" => TRUE,
		"db" => array(
			/*"type" => "pdo",
			"str" => "sqlite:/Applications/MAMP/htdocs/mollify/pdo_sqlite3.db",
			"user" => "mollify",
			"password" => "mollify"*/
			
			//"type" => "sqlite3",
			//"file" => "/Applications/MAMP/htdocs/mollify/sqlite3_2_4.db"
			
			/*"type" => "pdo",
			"str" => "mysql:host=localhost;dbname=mollify22",
			"user" => "mollify22",
			"password" => "mollify22",*/
			
			"type" => "mysql",
			"database" => "cloudberry",
			"user" => "cloudberry",
			"password" => "cloudberry",
			"charset" => "utf8"
		),
		"host_public_address" => "http://192.168.1.192:8888",
		"forbidden_file_upload_types" => array("png"),
		"authentication_methods" => array("pw", "ldap"),
		"timezone" => "Europe/Helsinki",	// change this to match your timezone,
		"enable_mail_notification" => TRUE,
		"mail_notification_from" => "admin@yourhost.com",
		"enable_change_password" => TRUE,
		"published_folders_root" => "/projects/mollify/data",
		//"customizations_folder" => "/Applications/MAMP/htdocs/mollify/custom/",
		"enable_thumbnails" => TRUE,
		//"mail_sender_class" => "mail/PHPMailerSender.class.php",
		"mail_smtp" => array(
			"host" => "smtp.gmail.com",
			"username" => "samuli.jarvela@gmail.com",
			"password" => "xxx",
			"secure" => TRUE
		),
		
		"plugins" => array(
			"Archiver" => array(),
			"Comment" => array(),
			"Share" => array(),
			"FileViewerEditor" => array(
				"viewers" => array(
					"Image" => array("gif", "png", "jpg"),
					"Google" => array("pdf", "tiff", "doc"),
					"JPlayer" => array("mp3")
				),
				"previewers" => array(
					"Image" => array("gif", "png", "jpg")
				),
				"editors" => array(
					"CKEditor" => array("html"),
					"TextFile" => array("txt", "js", "css", "xml", "xhtml", "py", "c", "cpp", "as3", "sh", "java", "sql", "php"),
				),
			),
			"ItemDetails" => array(),
			"ItemCollection" => array(),
			"SendViaEmail" => array(),
			"Notificator" => array(),
			"EventLogging" => array(),
			"Registration" => array(
				"require_approval" => TRUE,
				"groups" => array("5", "22"),
				"user_folder" => array(
					"path" => "/projects/mollify/data/users/"
				),
				"folders" => array(
					"1" => array(
						"permissions" => "rw"
					)
				)
			),
			"LostPassword" => array(
				"enable_hint" => TRUE
			)
		)
	);
?>