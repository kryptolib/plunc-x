<?php 

namespace Kryptolib\PluncX\App;

class MinifiedTokenRegistry {
    
    private const CHARS = 'abcdefghijklmnopqrstuvwxyz';

    private static array $tokens = [];

    /**
     * Calls itself recursively and until a unique 
     * token is generated
     * @return string
     */
    public static function generate(){
        $chars = Self::CHARS;
        $token 
            = $chars[rand(0,25)] 
            . $chars[rand(0,25)] 
            . rand(1,9);
        
        if (!in_array($token, static::$tokens)) {
            array_push(static::$tokens,$token);
            return $token;
        }
        return static::generate();
    }
}