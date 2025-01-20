<?php 

namespace Kryptolib\PluncX\Components;

use Kryptolib\PluncX\App\MinifiedTokenRegistry;
use Kryptolib\PluncX\App\UniqueTokenRegistry;
use Kenjiefx\ScratchPHP\App\Themes\ThemeController;
use Kryptolib\PluncX\Handlers\HandlerName;

/**
 * A registry of all the used component in a single
 * Page instance.
 */
class ComponentRegistry {

    /** An array of ComponentModels */
    private static array $ComponentModels = [];

    public static function register(string $name){
        if (!static::exists($name)) {
            $ThemeController = new ThemeController;
            $ThemeController->path()->components;
            $objectname = $name;
            if (str_contains($name, '/')){
                $tokens = explode('/', $name);
                $objectname = $tokens[count($tokens) - 1];
            }
            $componentdir = $ThemeController->path()->components . $name . '/';
            $ComponentDirectory = new ComponentDirectory(
                $componentdir,
                $objectname
            );
            $absolute_path 
                = str_replace('/', "\\", $ComponentDirectory->handler());
            $ComponentName = new HandlerName(
                object: $objectname,
                real: $name,
                unique: UniqueTokenRegistry::generate(
                    absolute_path: $absolute_path,
                    name: $name
                ),
                minified: MinifiedTokenRegistry::generate()
            );
            $ComponentModel = new ComponentModel(
                name: $ComponentName,
                dir: $componentdir,
                path: $ComponentDirectory
            );
            array_push(
                static::$ComponentModels, 
                $ComponentModel
            );
        }
    }

    public static function get(): ComponentIterator {
        $ComponentIterator = new ComponentIterator(
            static::$ComponentModels
        );
        return $ComponentIterator;
    }

    public static function count(): int{
        $result = 0;
        foreach (static::get() as $ComponentModel) {
            $result++;
        }
        return $result;
    }

    public static function exists(string $name): bool {
        $result = false;
        foreach (static::get() as $ComponentModel) {
            if ($ComponentModel->name->real === $name) {
                $result  = true;
            }
        }
        return $result;
    }

    public static function find(string $jspath){
        $result = null;
        foreach (static::get() as $ComponentModel) {
            if ($ComponentModel->path->handler() === $jspath) {
                $result = $ComponentModel;
            }
        }
        return $result;
    }

    public static function retrieve(string $name): ComponentModel{
        foreach (static::get() as $ComponentModel) {
            if ($ComponentModel->name->real === $name) {
                $result  = $ComponentModel;
            }
        }
        return $result;
    }

    /**
     * Clears all the contents of the registry
     * @return void
     */
    public static function clear(){
        static::$ComponentModels = [];
    }

}