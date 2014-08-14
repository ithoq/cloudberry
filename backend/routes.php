<?php

Route::get('/', function()
{
	return Response::json(array(
		'foo' => "bar"
	), 200);
});
