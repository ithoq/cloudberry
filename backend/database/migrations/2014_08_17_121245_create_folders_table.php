<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateFoldersTable extends Migration {

	public function up() {
		Schema::create('root_folders', function (Blueprint $table) {
			$table->increments('id');
			$table->string('name');
			$table->string('type', 64);
			$table->string('path');
			$table->string('description');
			$table->timestamps();
		});

		Schema::create('users_folders', function (Blueprint $table) {
			$table->integer('user_id')->unsigned();
			$table->integer('root_folder_id')->unsigned();
			$table->string('name')->nullable();
			$table->primary(array('user_id', 'root_folder_id'));
			$table->foreign('user_id')->references('id')->on('users');
			$table->foreign('root_folder_id')->references('id')->on('root_folders');
		});

		Schema::create('item_ids', function (Blueprint $table) {
			$table->char('id', 36);
			$table->integer('root_folder_id')->unsigned();
			$table->string('path');
			$table->timestamps();
			$table->foreign('root_folder_id')->references('id')->on('root_folders');
			$table->primary(array('id'));
		});
	}

	public function down() {
		Schema::dropIfExists('users_folders');
		Schema::dropIfExists('folders');
	}

}
