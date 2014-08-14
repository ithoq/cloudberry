<?php

namespace Cloudberry;

use Illuminate\Support\ServiceProvider;
use \Route;
use \Response;
use \Auth;

class CoreServiceProvider extends ServiceProvider {

    public function register()
    {
        /*$this->app->bind('cl_session', function()
        {
            return new CloudberrySession;
        });*/

		Route::controller('session', 'Cloudberry\SessionController');
    }

}

class SessionController extends \BaseController {

    public function getInfo()
    {
        return array(
			'user' => Auth::user()
		);
    }

    public function postLogin($nameOrEmail, $remember) {
    	
    }

}