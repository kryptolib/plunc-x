<?php 

namespace Kryptolib\PluncX;

use Kenjiefx\ScratchPHP\App\Components\ComponentEventDTO;
use Kenjiefx\ScratchPHP\App\Events\OnBuildCssEvent;
use Kenjiefx\ScratchPHP\App\Events\OnCreateComponentHtmlEvent;
use Kenjiefx\ScratchPHP\App\Events\OnCreateComponentJsEvent;
use Kenjiefx\ScratchPHP\App\Events\OnCreateTemplateEvent;
use Kenjiefx\ScratchPHP\App\Events\OnSettingsRegistryEvent;
use Kenjiefx\ScratchPHP\App\Templates\TemplateEventDTO;
use Kenjiefx\ScratchPHP\App\Themes\ThemeController;
use Kryptolib\PluncX\Framework\AppService;
use Kryptolib\PluncX\Framework\UI\RootInjector;
use Kryptolib\PluncX\NodeMinifier\TerserMinifier;
use Kenjiefx\ScratchPHP\App\Build\BuildEventDTO;
use Kenjiefx\ScratchPHP\App\Events\ListensTo;
use Kenjiefx\ScratchPHP\App\Events\OnBuildJsEvent;
use Kenjiefx\ScratchPHP\App\Interfaces\ExtensionsInterface;
use Kryptolib\PluncX\App\DependencyRegistry;
use Kryptolib\PluncX\App\DependencyService;
use Kryptolib\PluncX\App\UniqueTokenRegistry;
use Kryptolib\PluncX\Components\ComponentRegistry;
use Kryptolib\PluncX\Factories\FactoryRegistry;
use Kryptolib\PluncX\Handlers\HandlerGenerator;
use Kryptolib\PluncX\Handlers\HandlerService;
use Kryptolib\PluncX\Helpers\HelperRegistry;
use Kryptolib\PluncX\Services\ServiceRegistry;
use Kryptolib\PluncX\Config;

class App implements ExtensionsInterface {

    public function __construct(
        private Config $Config
    ){
        
    }
    
    #[ListensTo(OnBuildJsEvent::class)]
    public function javascript(BuildEventDTO $BuildEventDTO){

        FactoryRegistry::collect();
        ServiceRegistry::collect();
        HelperRegistry::collect();

        $components = ComponentRegistry::get();

        $DependencyRegistry = new DependencyRegistry();
        AppService::collect(
            $BuildEventDTO, 
            $DependencyRegistry
        );

        $script = 'const app = plunc.create("app");'.PHP_EOL;
        foreach ($components as $component) {
            $content = file_get_contents($component->path->handler());
            $DependencyRegistry->register(
                $component->path->handler(),
                $content
            );
            DependencyService::lookup(
                DependencyRegistry: $DependencyRegistry,
                content: $content,
                jspath: $component->path->handler()
            );
        }
        $keywords = ['AppService'];
        foreach ($DependencyRegistry->get() as $DependencyItem) {
            $HandlerGenerator = new HandlerGenerator(
                DependencyItem: $DependencyItem
            );
            $script .= $HandlerGenerator->generate();
            $unique_token = UniqueTokenRegistry::find($DependencyItem->abspath);
            if ($unique_token !== null) {
                $keywords[] = $unique_token;
            }
        }

        if (Config::minify()) {
            $Minifier = new TerserMinifier();
            $script = $Minifier->minify($script, $keywords);
        }

        ComponentRegistry::clear();

        /**
         * Do not clear UniqueTokenRegistry because we will lose all the 
         * collected FactoryRegistry, ServiceRegistry, and HelperRegistry,
         * as they will only lookup and register once.
         */
        # UniqueTokenRegistry::clear();

        $BuildEventDTO->content = $script;
    }


    #[ListensTo(OnSettingsRegistryEvent::class)]
    public function settings(array $settings){
        $this->Config::load($settings);
    }

    #[ListensTo(OnBuildCssEvent::class)]
    public function css(BuildEventDTO $BuildEventDTO): void
    {
        $csscode = $BuildEventDTO->content;
        $ThemeController = new ThemeController();
        $themedir = $ThemeController->getdir();
        $root = ':root{'.RootInjector::collect($themedir,$csscode).'}';
        $BuildEventDTO->content = $root . $csscode;
    }

    #[ListensTo(OnCreateComponentHtmlEvent::class)]
    public function CreateComponentHTML(ComponentEventDTO $ComponentEventDTO){
        $template = file_get_contents(__dir__ . '/templates/components/php.txt');
        $ComponentEventDTO->content = $template;
    }

    #[ListensTo(OnCreateComponentJsEvent::class)]
    public function onCreateComponentJS(ComponentEventDTO $ComponentEventDTO) {
        $name = $ComponentEventDTO->ComponentController->ComponentModel->name;
        $namespace = $name;
        
        if (str_contains($name, '/')){
            $tokens = explode('/', $name);
            $name = $tokens[count($tokens) - 1];
        }

        $template = file_get_contents(__dir__ . '/templates/components/ts.txt');
        $template =  str_replace(
            '==COMPONENT_NAME==', 
            $name, 
            $template
        );

        # Resolving relative path
        $pathnames = explode('/',$namespace);
        $converted = array_map(
            function($pathnames) { return '..'; },
            $pathnames
        );
        $relpath = implode('/', $converted);

        $template =  str_replace(
            '==RELATIVE_PATH==', 
            $relpath, 
            $template
        );

        $ComponentEventDTO->content = $template;

    }

    #[ListensTo(OnCreateTemplateEvent::class)]
    public function CreateTemplateListener(TemplateEventDTO $TemplateEventDTO): void{
        $templname = $TemplateEventDTO->TemplateController->TemplateModel->name;
        $phpath = $TemplateEventDTO->TemplateController->getpath();
        $tspath = str_replace(
            '.php',
            '.ts',
            $phpath
        );
        $templdir = dirname($tspath);
        if (!is_dir($templdir)) {
            throw new \Exception('PluncX: Unable to create typescript ' .
                'file for new template. Please make sure that the directory ' .
                'exists within the template directory: "' . $templdir .'"');
        }

        # Resolving relative path
        $pathnames = explode('/',$templname);
        $converted = array_map(
            function($pathnames) { return '..'; },
            $pathnames
        );
        $relpath = implode('/', $converted);

        # Get TS content 
        $templts = file_get_contents(
            __dir__ . '/templates/templates/ts.txt'
        );
        file_put_contents(
            $tspath,
            str_replace(
                '==RELATIVE_PATH==',
                $relpath,
                $templts
                )
        );

        # Get PHP content
        $template_php 
            = file_get_contents(
                filename: __dir__ . '/templates/templates/php.txt'
            );
        $TemplateEventDTO->content = $template_php;
    }

}