<?php 

namespace Kryptolib\PluncX\App;

class UniqueTokenRegistry {

    private static array $tokens = [];

    private static array $mappings = [];

    /**
     * Calls itself recursively and until a unique 
     * token is generated
     * @return string
     */
    public static function generate(
        string $name,
        string $absolute_path,
        ?int $iterator = 1
    ): string {
        if (str_contains(haystack: $name, needle: '/')){
            $tokens = explode(separator: '/', string: $name);
            $name = $tokens[count(value: $tokens) - 1];
        }
        $token = $name . '_' . $iterator;
        if (!in_array($token, static::$tokens)) {
            array_push(static::$tokens,$token);
            static::$mappings[$absolute_path] = $token;
            return $token;
        }
        $iterator++;
        return static::generate(
            name: $name,
            absolute_path: $absolute_path,
            iterator: $iterator
        );
    }

    public static function find(
        string $absolute_path
    ){
        return static::$mappings[$absolute_path] ?? null;
    }

    public static function clear(){
        static::$tokens = [];
        static::$mappings = [];
    }
}