<?php 

namespace Kryptolib\PluncX\Factories;

use Kenjiefx\ScratchPHP\App\Themes\ThemeController;
use Kryptolib\PluncX\App\MinifiedTokenRegistry;
use Kryptolib\PluncX\App\UniqueTokenRegistry;
use Kryptolib\PluncX\Handlers\HandlerName;
use Kryptolib\PluncX\Handlers\HandlerService;

class FactoryRegistry {

    private static array $FactoryModels = [];

    public static function collect(){

        /** Ensures that we only look up once */
        if (FactoryRegistry::has_looked_up()) return;

        $ThemeController = new ThemeController();
        $factories_dir 
            = HandlerService::convert(
                $ThemeController->getdir() . '/factories'
            );

        if (!\is_dir($factories_dir)) return;
        FactoryRegistry::lookup($factories_dir);
    }

    private static function has_looked_up(): bool {
        return count(static::$FactoryModels) > 0;
    }

    private static function lookup(
        string $directory
    ){
        $files = \array_diff(
            \scandir($directory), 
            ['.', '..']
        );
        foreach ($files as $file) {
            $path = $directory.'/'.$file;
            if (\is_dir($path)) {
                FactoryRegistry::lookup($path);
                continue;
            }
            FactoryRegistry::register($path);
        }
    }

    public static function get(): FactoryIterator {
        return new FactoryIterator(
            static::$FactoryModels
        );
    }

    public static function find(
        string $absolute_path
    ): FactoryModel {
        $result = null;
        foreach (FactoryRegistry::get() as $FactoryModel) {
            if ($FactoryModel->absolute_path === $absolute_path) {
                $result = $FactoryModel;
            }
        }
        return $result;
    }

    private static function register(
        string $path
    ){
        $absolute_path 
            = str_replace('/', "\\", $path);
        $object_name 
            = basename($path, ".js");
        $FactoryName = new HandlerName(
            $object_name,
            $object_name,
            UniqueTokenRegistry::generate(
                $object_name,
                $absolute_path
            ),
            MinifiedTokenRegistry::generate()
        );
        array_push(
            static::$FactoryModels,
            new FactoryModel(
                $FactoryName,
                $absolute_path
            )
        );
    }

}