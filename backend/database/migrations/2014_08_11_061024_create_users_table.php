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
			$table->string('password', 64);
			$table->string('email');
			$table->timestamp('expires')->nullable();
			$table->boolean('is_group')->default(FALSE);
			$table->char('type', 4)->nullable();
			$table->char('lang', 4)->nullable();
			$table->string('description');
			$table->rememberToken();
			$table->timestamps();
		});
	}

	public function down()
	{
		Schema::dropIfExists('users');
	}

}
