<?php

namespace Kryptolib\PluncX;

class Config
{

    private static $config = [];

    public static function load(array $config){
        static::$config = $config;
    }

    public static function minify(){
        return static::$config['minify'] ?? true;
    }
}
