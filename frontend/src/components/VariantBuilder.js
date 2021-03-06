import React from 'react';
import Select from '@atlaskit/select';
import { Grid, GridColumn } from '@atlaskit/page';
import Textfield from '@atlaskit/textfield';
import { getAttributeValues } from '../utils/api'
import { mkAttrQuery } from '../utils/utils';

// import ReactResizeDetector from 'react-resize-detector';

export default class ValueBuilder extends React.Component {


  state = {
    genome: '',
    chr: '',
    chr_opts: [],
    chr_start: '',
    chr_end: '',
    ref: '',
    ref_opts: [],
    alt: '',
    alt_opts: [],
  }


  componentDidMount() {

    if(this.props.chr) getAttributeValues(this.props.settings_id, this.props.chr,
      (result) => {
        console.log("chr: ", result);
         if(result) this.setState((oldState, _) => 
          {return {...oldState, chr_opts: result.map((e) => {return {key: e, label:e, value:e}})}});
      },
      (error) => {
        console.log(error)
      }
    )

    if(this.props.ref_) getAttributeValues(this.props.settings_id, this.props.ref_,
      (result) => {
        console.log("ref: ", result);
        if(result) this.setState((oldState, _) => 
          {return {...oldState, ref_opts: result.map((e) => {return {key: e, label:e, value:e}})}});
      },
      (error) => {
        console.log(error)
      }
    )

    if(this.props.alt) getAttributeValues(this.props.settings_id, this.props.alt,
      (result) => {
        console.log("alt: ", result);
         if(result) this.setState((oldState, _) => 
          {return {...oldState, alt_opts: result.map((e) => {return {key: e, label:e, value:e}})}});
      },
      (error) => {
        console.log(error)
      }
    )

    this.props.setQuery(this.mkQuery(this.state));

  }

  componentWillUnmount() {
    this.props.deleteQuery();
  }


  mkQuery = state => {
    return {
        operator:"and",
        children: [
          mkAttrQuery(this.props.assembly, (v)=>v, 'is', state.assembly),
          mkAttrQuery(this.props.chr, (v)=>v, 'is', state.chr),
          mkAttrQuery(this.props.chr_start, (v)=>v, 'is', state.chr_start),
          mkAttrQuery(this.props.chr_end, (v)=>v, 'is', state.chr_end),
          mkAttrQuery(this.props.ref_, (v)=>v, 'is', state.ref),
          mkAttrQuery(this.props.alt, (v)=>v, 'is', state.alt),
        ]
      }
  }

  handleChange = prop_name => e =>  {

    const newState = {...this.state};
    if (prop_name === 'chr_start' || prop_name === 'chr_end') {
      newState[prop_name] = e.target.value;
    } else {
      newState[prop_name] = e.value;
    }
    
    this.setState(newState);
    this.props.setQuery(this.mkQuery(newState));
  }

  render() {  

    return(
      // <ReactResizeDetector handleHeight onResize={(width, height) => this.props.onHeightChange(height)}>
      <div className="builder">
        <div className={this.props.hrule ? "hrule": ""}><h3 style={{paddingBottom: this.props.hrule ?'0.5em' : '1.2em'}}>Variant</h3></div>
        <div style={{display:'flex', flexWrap: 'wrap'}}>
          <div style={{minWidth:'100px', marginRight:'5px', marginBottom: '5px'}}>
            <Select
              style={{maxWidth:'30%'}}
              className="single-select"
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
                styles={{
                      menuPortal: base => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
              placeholder="Genome"
              options={[
                { label: 'GRCh37', value: 'GRCh37' },
                { label: 'GRCh38', value: 'GRCh38' },
              ]}
              onChange={this.handleChange('assembly')} 
            />
          </div>
          <div style={{minWidth:'125px', marginRight:'5px', marginBottom: '5px'}}>
            <Select
              placeholder="Select input"
              menuPortalTarget={document.body}
                styles={{
                      menuPortal: base => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
              options={this.state.chr_opts}
              onChange={this.handleChange('chr')} 
            />
          </div>
          <div style={{minWidth:'80px', marginRight:'5px', marginBottom: '5px'}}>
          <Textfield
                placeholder="Chr start"
                onChange={this.handleChange('chr_start')}
              />
          </div>
          <div style={{minWidth:'90px', marginRight:'5px', marginBottom: '5px'}}>
          <Textfield
                placeholder="Chr end"
                onChange={this.handleChange('chr_end')}
              />
          </div>
          <div style={{minWidth:'70px', marginRight:'5px', marginBottom: '5px'}}>
            <Select
              placeholder="REF"
              menuPortalTarget={document.body}
                styles={{
                      menuPortal: base => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
              options={this.state.ref_opts}
              onChange={this.handleChange('ref')}
            />
          </div>
          <div style={{minWidth:'70px', marginRight:'5px', marginBottom: '5px'}}>
            <Select
              className="single-select"
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
                styles={{
                      menuPortal: base => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
              placeholder="ALT"
              options={this.state.alt_opts}
              onChange={this.handleChange('alt')} 
            />
          </div>
        </div>
      </div>
      // </ReactResizeDetector>
    );
  }
}