<?php

class DatabaseSeeder extends Seeder {

	public function run() {
		Eloquent::unguard();

		$this->call('TestDataSeeder');
	}

}

class TestDataSeeder extends Seeder {

	public function run() {
		DB::table('users')->delete();

		$user = Cloudberry\User::create(array(
				'name'     => 'admin',
				'email'    => 'foo@bar.com',
				'password' => Hash::make('admin'),
				'is_group' => FALSE,
				'type'     => 'a',
			));

		DB::table('folders')->delete();
		DB::table('users_folders')->delete();

		$folder = new Cloudberry\Filesystem\RootFolder(array(
				'name' => 'test',
				'path' => '/projects/mollify/data/test',
				'type' => 'local',
			));

		$user->folders()->save($folder);
	}

}