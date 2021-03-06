import React, { Component, Fragment } from 'react';

import Spinner from '@atlaskit/spinner';
import ModalDialog, { ModalFooter, ModalTransition } from '@atlaskit/modal-dialog';
import ToggleStateless from '@atlaskit/toggle';
import Textfield from '@atlaskit/textfield';

import { Alert,Radio } from 'antd';

import ContentWrapper from '../components/ContentWrapper';
import PageTitle from '../components/PageTitle';
import { mkLabel, getType, mergeExists, removeEmpty, humanReadableQuery, generateFinalQuery, pruneTree, mkQueryTree, collectQueries } from '../utils/utils'

import { typeMap, resultsTypeMap } from '../components/types'
import { getUserIsAdminOf } from '../utils/api'

import styled from 'styled-components';

import { Responsive, WidthProvider } from 'react-grid-layout';


import Button, { ButtonGroup } from '@atlaskit/button';
import Page, { Grid, GridColumn } from '@atlaskit/page';
import Select from '@atlaskit/select';

import CrossIcon from '@atlaskit/icon/glyph/cross';
import EditorSettingsIcon from '@atlaskit/icon/glyph/editor/settings';

import { AkCode, AkCodeBlock } from '@atlaskit/code';
import Collapsible from 'react-collapsible';

import { CSSTransition } from 'react-transition-group';
import './animations.css'
import './DiscoveryPageGrid.css'

const queryBuilders = Object.keys(typeMap).filter(e => 'settings_type' in typeMap[e]).map(e => {return {value:e, label: typeMap[e].label}})

const resultViews = Object.keys(resultsTypeMap).map(e => {return {value:e, label: resultsTypeMap[e].label}})

const ResponsiveGridLayout = WidthProvider(Responsive);


const grid_settings = {
  lg: {width:960, cols:8, label:'Large'}, 
  md: {width:720, cols:6, label:'Medium'}, 
  sm: {width:600, cols:4, label:'Small'}, 
  xs: {width:480, cols:1, label:'Extra Small'}, 
  xxs: {width:360, cols:1, label:'Tiny'},
  xxxs: {width:340, cols:1, label:'Extra Tiny'}};

const rowHeight = 16;

export default class DiscoveryPageGrid extends Component {
  gridRef = React.createRef();

  state = {
    counter:0,
    title: 'Query builder',
    componentSettingsModalKey:null,
    resultViewSettingsModal:false,
    layouts: {lg:[], md:[], sm:[], xs:[], xxs: []},
    // currentBreakpoint: 'lg',
    components: {},
    componentHeights:{},
    componentHeightsChanged:false,
    queries: {},
    result_view: {type: 'CountResultView', query_tag:'count'},
    result_data: {},
    isLoaded: false,
    debug: false,
    edit: false,
    canEdit:false,
    editSize: 'lg',
    // error:'aadfbdfbmdfhkdfzjkhdfkfkjfkjfakjhfdkhjfdkjhfadkfkfkfkhjdfbmndfkfdkhdfkhjdfklhdeklhjsdLKwdlkdewlkwdkldkaa'
  };

  componentDidMount() {
    const id = window.id ? window.id : this.props.match.params.id;
    fetch(
      process.env.REACT_APP_API_URL+"/discover/loadSettings/"+id, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(res => res.json())
      .then(
        (result) => {
          console.log(result);
          if(result){
            const parsed = JSON.parse(result);
            // console.log(JSON.parse(result));
            // console.log("prune&mkQueryTree:", pruneTree(mkQueryTree(JSON.parse(result))));

            const items = Object.keys(parsed.components);
            var maxVal = 0, v;
            for (var i = 0; i < items.length; i++) {
              v = parseInt(items[i]);
              if(v > maxVal) maxVal = v;
            }


            // fix layouts that have an infinity y value, which has been serialised as null
            const layouts = Object.keys(parsed.layouts);
            for (var l = 0; l < layouts.length; l++) {
              const layout = layouts[l];
              for (var i = 0; i < parsed.layouts[layout].length; i++) {
                if(parsed.layouts[layout][i].y === null) parsed.layouts[layout][i].y = Infinity
              }
            }

            this.setState({
              isLoaded: true,
              title: parsed.title?parsed.title:'<Title>',
              components: parsed.components,
              layouts: parsed.layouts,
              counter: maxVal+1,
              result_view: parsed.result_view ? parsed.result_view : this.state.result_view,
            });
          } else {
            this.setState({
              isLoaded: true,
              // info: `The discovery page '${id}' does not exist yet. To create it, press edit...`
            });
          }
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            error: error
          });
        }
    )

    getUserIsAdminOf(id, 
      (result) => {
        this.setState({
          canEdit: result,
          edit: result ? this.state.edit : false,
          debug: result ? this.state.debug : false,
        });
      }, 
      (error) => {
        this.setState({
          error: error
        });
      })
  }


  renderBuilderFromComponent = (key, item) => {
    const TypeTag = typeMap[item.type].type
    const id = window.id ? window.id : this.props.match.params.id;
    return <TypeTag 
      setQuery={this.storeQuery(`${key}`)}
      deleteQuery={this.deleteQuery(`${key}`)}
      settings_id={id} 
      // onHeightChange={this.componentHeightChanged(`${key}`)} 
      {...item.data}/>
  }


  renderResult = (item, data) => {
    const TypeTag = resultsTypeMap[item.type].type
    return <TypeTag 
      results={data}
      {...item.data}/>
  }


  renderResultSettings = (item) => {
    const TypeTag = resultsTypeMap[item.type].settings_type;
    const id = window.id ? window.id : this.props.match.params.id;
    return <TypeTag 
      setData={(data) => {this.setState({result_view:{...this.state.result_view, data:data}})}} 
      data={item.data? item.data : {}} 
      settings_id={id}/>
  }


  renderBuilderSettingsFromComponent = (key, item) => {
    const TypeTag = typeMap[item.type].settings_type
    const id = window.id ? window.id : this.props.match.params.id;
    return <TypeTag setData={this.storeBuilderSettings(`${key}`)} data={item.data} settings_id={id}/>
  }


  storeQuery = (id) => {
    return (query_data) => {
      this.setState((prevState,_) => ({
        queries: {... prevState.queries, [id]: query_data},
        // query: collectQueries(prevState.tree, 'root', {... prevState.queries, [id]: query_data})
      }));
    }
  }


  deleteQuery = (id) => {
    return () => {
      this.setState((prevState,_) => {
        const newQueries = {... prevState.queries};
        delete newQueries[id];
        return {
          queries: newQueries,
        }
      });
    }
  }

  componentHeightChanged = (id) => {
    return (height) => {
      if(this.state.componentHeights[id] !== height)
        this.setState((oldState)=>{ return {componentHeightsChanged:true, componentHeights: {...oldState.componentHeights, [id]: height}}})
    }
  }

  storeBuilderSettings = (id) => {
    return (data) => {
      var newComponents = {...this.state.components}
      newComponents[id].data = data
      
      this.setState({ components: newComponents });
    }
  }

  // we only want to update if we are not in the modal dialog, since any up update will automatically close it
  shouldComponentUpdate(nextProps, nextState) { 
    // console.log(nextState.componentSettingsModalKey, this.state.componentSettingsModalKey)
    return ((!nextState.componentSettingsModalKey || nextState.componentSettingsModalKey !== this.state.componentSettingsModalKey) && 
            (!nextState.resultViewSettingsModal || nextState.resultViewSettingsModal !== this.state.resultViewSettingsModal));
  }



  runQuery = () => {
    this.setState({
      showLoadingState: true
    });
    // const jsAPIQuery = generateJsonAPIQuery(this.state.query)
    // console.log(JSON.stringify({'query': { 'operator':'and', 'children': this.state.queries}}));
    fetch(
      process.env.REACT_APP_API_URL+"/query", {
        method:'POST',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({'query': generateFinalQuery(Object.values(this.state.queries)), result_type: this.state.result_view.query_tag})
      })
      .then(res => res.json())
      .then(
        (result) => {
          // var jsonRes = result.map(r => JSON.parse(r));
          console.log(result);
          // var resultsNew = jsonRes.map((j,i) => { 
          //   return {id:i, source: Object.keys(j)[0], counts: j[Object.keys(j)[0]].length}
          // });
          this.setState({
            result_data: result,
            showLoadingState: false
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            error: error.error,
            showLoadingState: false
          });
        }
      )
  }



  

  getOffset = () => {
    const { isLoaded, error, info } = this.state;
    let offset = 0;
    if (error) offset += 40;
    if (info) offset += 40;
    if (!isLoaded) offset += 40;
    return offset;
  }

  onLayoutChange = (layout: Layout, layouts: {[string]: Layout}) => {
    this.setState({layouts: layouts});
  }

  toggleEdit = () => {
    this.setState((oldState,_) => {
      const newLayouts = {};
      for (var i = 0; i < Object.keys(oldState.layouts).length; i++) {
        const k = Object.keys(oldState.layouts)[i];
        newLayouts[k] = oldState.layouts[k].map((e) => {return {...e, static: !e.static}});
      }

      

      return {edit: !oldState.edit, editSize: 'lg', maxWidthEdit:null, layouts:newLayouts}
    }, () => {
      if(!this.state.edit){
        // console.log("saving...")
        this.saveSettings();
      }
      this.gridRef.current.onWindowResize()
    })
  }

  deleteItem = (k) => () => {
    const newComponents = {...this.state.components};
    delete newComponents[k];
    const newLayouts = {};

    for (var i = 0; i < Object.keys(this.state.layouts).length; i++) {
      const layout_key = Object.keys(this.state.layouts)[i];
      newLayouts[layout_key] = this.state.layouts[layout_key].filter((i) => i.i !== k)
    }

    this.setState({components: newComponents, layouts: newLayouts});

  }


  addItem = (type) => this.setState((oldState) => {
    const key = oldState.counter;
    const minHeight = typeMap[type].minHeight?typeMap[type].minHeight:3;

    const newComponents = {...oldState.components, [`${key}`]: {type: type}};
    const newLayouts = {};

    for (var i = 0; i < Object.keys(this.state.layouts).length; i++) {
      const layout_key = Object.keys(this.state.layouts)[i];
      console.log(layout_key);
      newLayouts[layout_key] = [...oldState.layouts[layout_key], {i:`${key}`, x:0, y:Infinity, w:8, h:minHeight, minH: minHeight, static:false}]
    }

    return {components: newComponents, layouts: newLayouts, counter: key+1}
  }, this.forceUpdate())

  maxWidthEditChange = (e) => {
    var w = grid_settings[e.target.value].width+1;
    this.setState({editSize: e.target.value, maxWidthEdit: w}, this.gridRef.current.onWindowResize);
  }



  openSettings = (key) => () => this.setState({ componentSettingsModalKey: key })

  toggleResultViewSettings = (visibility) => this.setState({resultViewSettingsModal: visibility})


  closeSettings = () => this.setState({ componentSettingsModalKey: null })

  saveSettings = () => {
    const id = window.id ? window.id : this.props.match.params.id;
    fetch(
      process.env.REACT_APP_API_URL+"/discover/saveSettings/"+id, {
        method:'POST',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({title: this.state.title, components:this.state.components, layouts:this.state.layouts, result_view:this.state.result_view})
      })
      .then(res => res.json())
      .then(
        (result) => {
          // console.log(JSON.stringify({id: this.props.match.params.id, data:{components:this.state.components, layouts:this.state.layouts}}));
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          console.log(error)
        })
  }

  // reset all layouts to lg
  applyLayoutToAll = () => {
    const newLayouts = {};
    const lgNodes = this.state.layouts.lg;
    lgNodes.sort((a, b) => a.y - b.y === 0 ? a.x - b.x : a.y - b.y)
    console.log(lgNodes.map((n) => n.i))

    if (lgNodes.length > 0){
      var currentY = lgNodes[0].h;
      for (var i = 1; i < lgNodes.length; i++) {
        lgNodes[i].y = currentY;
        currentY += lgNodes[i].h;
      }
    }
    

    for (var i = 0; i < Object.keys(this.state.layouts).length; i++) {
      const l = Object.keys(this.state.layouts)[i];
      newLayouts[l] = lgNodes;
    }
    this.setState({layouts: newLayouts})
  }

  render() {

    const { title, error, info, debug, isLoaded, layouts, components, canEdit, edit, editSize, maxWidthEdit, componentSettingsModalKey,
      result_view, result_data, resultViewSettingsModal } = this.state;

    const items = Object.keys(components).map((k) => { 
        return (
          <div 
            key={k} 
          >
          <CSSTransition
            in={edit}
            timeout={300}
            classNames="blue"
          >
            <div style={{
              ...(edit?{  background: 'rgb(222, 235, 255)'}:{}), 
              height:'100%',
              // overflowY:'hidden'
            }}>
              <CSSTransition
                in={edit}
                timeout={300}
                classNames="add-menu"
                unmountOnExit
              >
                <div style={{position:'absolute', right:5, top:5, zIndex:5}}>
                  <Button appearance={'subtle'} spacing="none" onClick={this.openSettings(k)}>
                    <EditorSettingsIcon/>
                  </Button>
                  <Button appearance={'subtle'} spacing="none" onClick={this.deleteItem(k)}>
                    <CrossIcon/>
                  </Button>
                </div>
              </CSSTransition>
              <div style={{padding:'5px'}}>
                {this.renderBuilderFromComponent(k, components[k])}
              </div>
            </div>
          </CSSTransition>
          </div>)
      })

    return (
      <Page bannerHeight={this.getOffset()}
        isBannerOpen={!isLoaded || error || info}
        banner={
        <Fragment>
        {!isLoaded ?
          (<Alert
            message='Loading interface...'
            banner
            type="info"
          />) : null}
        {error ?
          (<Alert
            message={error}
            banner
            closable
            onClose={() => this.setState({error: null})}
            type="error"
          />) : null}
        {info ?
          (<Alert
            message={info}
            banner
            closable
            onClose={() => this.setState({info: null})}
            type="info"
          />) : null}
        </Fragment>
      }>      
        <div className="discovery-container">
          <div className="discovery-header">
            {edit?<div style={{paddingTop: '12px', maxWidth:'300px'}}><Textfield
              name="label"
              style={{fontSize:'29px', height:'30px'}}
              defaultValue={title}
              onChange={(e) => {this.setState({title: e.target.value})}}/></div>:<PageTitle style={{paddingTop: '12px'}}>{title}</PageTitle>}
            {canEdit && <span style={{paddingLeft:'15px', marginTop:'13px'}}>
              <Button 
                appearance={!edit?"subtle":"primary"} 
                onClick={this.toggleEdit}>
                {edit?'Save':'Edit'}
              </Button>
            </span>}
            
            {canEdit && <span style={{paddingLeft:'15px', marginTop:'16px'}}>
              <ToggleStateless isDefaultChecked={this.state.debug} onChange={() => this.setState({debug: !this.state.debug})}/>
            </span>}
            {canEdit && <span style={{marginTop:'19px', fontSize: '14px'}}>
              Debug mode
            </span>}
          </div>

          <CSSTransition
            in={edit}
            timeout={300}
            classNames="width-box"
            unmountOnExit
          >
            <div>
             <h4 className="width-label"></h4>
              <div className="width-radio-group" style={{
                ...(editSize === 'lg' ? {position:'relative', left: '-123px'} : {}),
                padding: '0px', 
                display:'flex', 
                justifyContent: 'center'}
              }>
                {editSize === 'lg' && <Button appearance="subtle" style={{marginRight:'107px'}} onClick={this.applyLayoutToAll}>Apply layout to all</Button>}
                <Radio.Group onChange={this.maxWidthEditChange} defaultValue="lg" >
                  {Object.keys(grid_settings).map((i) => {return (<Radio.Button key={i} value={i}>{grid_settings[i].label}</Radio.Button>)})}
                </Radio.Group>
              </div>

            </div>
        </CSSTransition>

          <div className="discovery-grid-container">
          <CSSTransition
            in={edit}
            timeout={300}
            classNames="outline"
          >
            <div style={{
              ...(maxWidthEdit?{maxWidth:`${maxWidthEdit}px`} :{}), 
              marginLeft: 'auto', marginRight: 'auto'
            }}>
            <ResponsiveGridLayout className="discovery-grid" 
              breakpoints={Object.fromEntries(Object.entries(grid_settings).map(([k, v]) => [k, v.width]))}
              cols={Object.fromEntries(Object.entries(grid_settings).map(([k, v]) => [k, v.cols]))}
              layouts={layouts}
              rowHeight={rowHeight}
              ref={this.gridRef}
              onLayoutChange={this.onLayoutChange}
              onWidthChange={this.onWidthChange}
              onBreakpointChange={this.onBreakpointChange}>
              {items}
            </ResponsiveGridLayout>
            </div>
          </CSSTransition>
          </div>

          <CSSTransition
            in={!edit}
            timeout={300}
            classNames="query-table"
            unmountOnExit
          >
            <div className="discovery-results">
              <Button isLoading={this.state.showLoadingState} appearance="primary" onClick={this.runQuery}>Run query</Button>
              <h4 style={{paddingTop:'2em', paddingBottom:'10px'}}>Results:</h4>
              {this.renderResult(result_view, result_data)}           
              {debug &&
              <div className="discovery-results">
                <h4 style={{paddingTop:'30px', paddingBottom:'10px'}}>Human readable Query:</h4>
                <AkCodeBlock 
                  language="text" 
                  text={humanReadableQuery(generateFinalQuery(Object.values(this.state.queries)), null, 2)} 
                  showLineNumbers={false}/>
                
                <h4 style={{paddingBottom:'10px'}}>API query:</h4>
                <AkCodeBlock 
                  language="json" 
                  text={JSON.stringify(generateFinalQuery(Object.values(this.state.queries)), null, 2)} 
                  showLineNumbers={false}/>
                <h4 style={{paddingTop:'30px', paddingBottom:'10px'}}>Raw Queries:</h4>
                <AkCodeBlock 
                  language="json" 
                  text={JSON.stringify(this.state.queries, null, 2)} 
                  showLineNumbers={false}/>
              </div>}
            </div>
          </CSSTransition>

          <CSSTransition
            in={edit}
            timeout={300}
            classNames="add-menu"
            unmountOnExit
          >
          <div className="discovery-results">
            <h4 style={{paddingBottom:'10px'}}>Add a query builder:</h4>
            <Select
              options={queryBuilders}
              onChange={(k) => this.addItem(k.value)}
              placeholder="Select a box to add" />


            <h4 style={{paddingBottom:'10px'}}>Select result view:</h4>
            <div style={{
                display:'flex', 
                justifyContent: 'stretch'}
            }>
              <div style={{flexGrow: 1}}>
              <Select
              options={resultViews}
              defaultValue={{value: result_view.type, label: resultsTypeMap[result_view.type].label}}
              onChange={(k) => this.setState({result_view: {type:k.value, query_tag:resultsTypeMap[k.value].query_tag}})}
              placeholder="Select a box to add" /></div>

            {resultsTypeMap[result_view.type].settings_type != null && 
            <div style={{paddingLeft:'5px'}}>
            <Button style={{height:'40px'}} appearance={'subtle'} spacing="none" onClick={() => this.toggleResultViewSettings(true)}>
              <EditorSettingsIcon/>
            </Button>
            </div>}
          </div>

            {debug && 
            <div>
              <h4 style={{paddingTop:'30px', paddingBottom:'10px'}}>Tree:</h4>
              <AkCodeBlock 
                language="json" 
                text={JSON.stringify({components:this.state.components, layouts:this.state.layouts, result_view:this.state.result_view}, null, 2)} 
                showLineNumbers={false}/>
            </div>}
          </div>
        </CSSTransition>


         <ModalTransition>
          {componentSettingsModalKey && (
            <ModalDialog
              heading={`Settings - ${typeMap[components[componentSettingsModalKey].type].label}`}
              width="large"
              onClose={this.closeSettings}
              components={{
                Container: ({ children, className }: ContainerProps) => (
                  <div className={className}>
                    {children}
                  </div>
                ),
                Footer: (props: FooterProps) => (
                  <ModalFooter showKeyline={props.showKeyline}>
                    <span />
                    <Button appearance="primary" onClick={this.closeSettings}>
                      Done
                    </Button>
                  </ModalFooter>
                )
              }}
            >
              {this.renderBuilderSettingsFromComponent(componentSettingsModalKey, components[componentSettingsModalKey])}
            </ModalDialog>
          )}
        </ModalTransition>
       

       <ModalTransition>
          {resultViewSettingsModal && (
            <ModalDialog
              heading={`Settings - ${resultsTypeMap[result_view.type].label}`}
              width="large"
              onClose={() =>{ this.toggleResultViewSettings(false) } }
              components={{
                Container: ({ children, className }: ContainerProps) => (
                  <div className={className}>
                    {children}
                  </div>
                ),
                Footer: (props: FooterProps) => (
                  <ModalFooter showKeyline={props.showKeyline}>
                    <span />
                    <Button appearance="primary" onClick={() => this.toggleResultViewSettings(false)}>
                      Done
                    </Button>
                  </ModalFooter>
                )
              }}
            >
              {this.renderResultSettings(result_view)}
            </ModalDialog>
          )}
        </ModalTransition>
        </div>
      </Page>
    );
  }


}
