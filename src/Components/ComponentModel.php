<?php 

namespace Kryptolib\PluncX\Components;

use Kryptolib\PluncX\Handlers\HandlerName;

/**
 *  Representing a single instance of a component.
 */
class ComponentModel {

    public function __construct(
        public readonly HandlerName $name,
        public readonly string $dir,
        public readonly ComponentDirectory $path
    ){

    }

}