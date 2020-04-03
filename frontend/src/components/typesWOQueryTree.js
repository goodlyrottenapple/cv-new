// export {default as VariantBuilder} from './VariantBuilder';
import VariantBuilder from './VariantBuilder';
import BetweenBuilder from './BetweenBuilder';
import SliderBetweenBuilder from './SliderBetweenBuilder';
import PickerBuilder from './PickerBuilder';
import ButtonGroupPickerBuilder from './ButtonGroupPickerBuilder';
import ValueBuilder from './ValueBuilder';
import PhenotypeBuilder from './PhenotypeBuilder';
import EmptyBuilder from './EmptyBuilder';



// import VariantBuilderSettings from './settings/VariantBuilderSettings';
import BetweenBuilderSettings from './settings/BetweenBuilderSettings';
import SliderBetweenBuilderSettings from './settings/SliderBetweenBuilderSettings';
import PickerBuilderSettings from './settings/PickerBuilderSettings';
import ValueBuilderSettings from './settings/ValueBuilderSettings';
// import PhenotypeBuilderSettings from './settings/PhenotypeBuilderSettings';
import EmptyBuilderSettings from './settings/EmptyBuilderSettings';



export const typeMap = {
    'EmptyBuilder': {
    	type: EmptyBuilder,
    	settings_type: EmptyBuilderSettings,
    	label: 'Boolean group'
    },
    'VariantBuilder': { type: VariantBuilder },
    'BetweenBuilder': { 
    	type: BetweenBuilder,
    	settings_type: BetweenBuilderSettings,
    	label: 'Range text input' },
    'SliderBetweenBuilder': { 
    	type: SliderBetweenBuilder,
    	settings_type: SliderBetweenBuilderSettings,
    	label: 'Range slider' },
    'PickerBuilder': { 
    	type: PickerBuilder, 
    	settings_type: PickerBuilderSettings,
    	label: 'Dropdown'
    },
    'ButtonGroupPickerBuilder': { 
    	type: ButtonGroupPickerBuilder, 
    	settings_type: ValueBuilderSettings,
    	label: 'Button group'
    },
    'ValueBuilder': {
    	type: ValueBuilder,
    	settings_type: ValueBuilderSettings,
    	label: 'Text input'
    },
    'PhenotypeBuilder': { 
    	type: PhenotypeBuilder, 
    	settings_type: ValueBuilderSettings,
    	label: 'Phenotype input' 
    },
  }