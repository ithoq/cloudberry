<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration {

	public function up()
	{
		Schema::create('users', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('name');
			$table->string('email');
			$table->dateTime('expires')->nullable();
			$table->boolean('is_group');
			$table->rememberToken();
			$table->timestamps();
		});
	}

	public function down()
	{
		Schema::dropIfExists('users');
	}

}
