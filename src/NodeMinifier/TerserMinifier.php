<?php

namespace Kryptolib\PluncX\NodeMinifier;

/**
 * 
 * A minification service that runs on top of 
 * Terser minifier
 */
class TerserMinifier {
    private string $codeBlock = '';

    private array $originalTree = [];

    public function __construct(
    ){
        
    }

    public function minify(string $codeBlock, array $unique_tokens){
        $this->codeBlock = $codeBlock;
        return $this->start($unique_tokens);
    }

    public function start(array $unique_tokens){
        file_put_contents(__dir__ .'/src.js', $this->codeBlock);
        $reserved = [
            '\"$scope\"',
            '\"$patch\"',
            '\"$block\"',
            '\"$parent\"',
            '\"$children\"',
            '\"$app\"'
        ];
        foreach ($unique_tokens as $unique_token) {
            array_push($reserved, '\"' . $unique_token .'\"');
        }

        $arg        = "[" . implode(',' , $reserved) . "]";
        $exitCode   = 0;
        $output     = [];
        $sourcePath = __dir__.'/terser.js ';
        exec(
            'node '.$sourcePath.$arg,
            $output,
            $exitCode
        );
        
        return file_get_contents(__dir__ . '/min.js');
    }
}