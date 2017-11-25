import React from 'react'
import {
    Grid,
    Row
} from 'react-bootstrap'
import { connect } from 'react-redux'
import Main from './Main';
import Docs from './Docs';
import Tests from './Tests'
import { questions } from '../questions'

class Content extends React.Component {
    constructor(props) {
        super(props);
        this.switchContent = this.switchContent.bind(this);
    }

    switchContent(currentPage) {
        switch(currentPage.pageName) {
            //case 'MAIN': return <Main />
            case 'DOCS': return <Docs />;
            case 'TESTS': return <Tests testID={currentPage.subPageName} questions={questions} />;
            case 'ABOUT': return 'О программе';
            default: return <Main />
        }
    }

    render() {
        return (
            <Grid>
                <Row>
                    {this.switchContent(this.props.currentPage)}
                </Row>
            </Grid>
        );
    }
}

export default connect(
    state => ({
        currentPage: state.currentPage
    })
)(Content);