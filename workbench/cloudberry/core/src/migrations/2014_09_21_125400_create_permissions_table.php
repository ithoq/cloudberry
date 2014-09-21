<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreatePermissionsTable extends Migration {

	public function up() {
		Schema::create('permissions', function (Blueprint $table) {
			$table->string('name');
			$table->integer('user_id')->unsigned();
			$table->string('subject', 255);
			$table->string('value', 32);
			$table->timestamps();
			$table->primary(array('name', 'user_id', 'subject'));
			$table->foreign('user_id')->references('id')->on('users');
		});
	}

	public function down() {
		Schema::dropIfExists('permissions');
	}

}
