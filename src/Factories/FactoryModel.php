<?php 

namespace Kryptolib\PluncX\Factories;

use Kryptolib\PluncX\Handlers\HandlerName;

class FactoryModel {

    public function __construct(
        public readonly HandlerName $name,
        public readonly string $absolute_path
    ){
        
    }

}