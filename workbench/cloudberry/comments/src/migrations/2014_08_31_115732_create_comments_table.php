<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateCommentsTable extends Migration {

	public function up() {
		Schema::create('comments', function (Blueprint $table) {
			$table->increments('id');
			$table->string('comment');
			$table->integer('user_id')->unsigned();
			$table->timestamps();
			$table->foreign('user_id')->references('id')->on('users');
		});

		Schema::create('items_comments', function (Blueprint $table) {
			$table->integer('comment_id')->unsigned();
			$table->char('item_id', 36);
			$table->foreign('comment_id')->references('id')->on('comments');
			$table->foreign('item_id')->references('id')->on('item_ids');
		});
	}

	public function down() {
		Schema::dropIfExists('items_comments');
		Schema::dropIfExists('comments');
	}

}
