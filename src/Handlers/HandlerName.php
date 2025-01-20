<?php 

namespace Kryptolib\PluncX\Handlers;

class HandlerName {

    /**
     * The name of the handler, which does not
     * contain the namespace
     * @var string
     */
    public readonly string $object;

    /**
     * The real name of the handler, which 
     * contains a namespace
     * @var string
     */
    public readonly string $real;

    /**
     * Tokenized name of the component, derived 
     * from its name and namespace
     * @var string
     */
    public readonly string $unique;

    /**
     * Minified name of the component, generated
     * randomly
     * @var string
     */
    public readonly string $minified;

    public function __construct(
        string $object,
        string $real,
        string $unique,
        string $minified
    ){
        $this->object = $object;
        $this->real = $real;
        $this->unique = $unique;
        $this->minified = $minified;
    }

}