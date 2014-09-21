<?php

namespace Cloudberry\Core;

use Illuminate\Auth\Reminders\RemindableInterface;
use Illuminate\Auth\Reminders\RemindableTrait;
use Illuminate\Auth\UserInterface;
use Illuminate\Auth\UserTrait;

class User extends \Eloquent implements UserInterface, RemindableInterface {

	use UserTrait, RemindableTrait;

	protected $table = 'users';

	protected $hidden = array('password', 'remember_token');

	public function rootFolders() {
		return $this->belongsToMany('Cloudberry\Core\Filesystem\RootFolder', 'users_folders', 'user_id', 'root_folder_id')->withPivot('name');
	}

	public function isAdmin() {
		return ($this->type == 'a');
	}

}
