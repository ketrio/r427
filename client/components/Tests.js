import React from 'react';
import { connect } from 'react-redux'
import {
    ButtonToolbar,
    ToggleButtonGroup,
    ToggleButton,
    FormControl,
    FormGroup,
    Button,
    Panel,
    Table,
    PageHeader
} from 'react-bootstrap';
import secToMin from 'sec-to-min'
import { saveResults, validateAnswers, login, setTime, navigate, retry } from '../actions';
import { userStatus } from '../constants';

class Tests extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            elapsedTime: 0,
            answers: new Array(this.props.questions.length).fill(null),
            name: '',
            group: '',
            variant: null
        };
        this.validateInput = this.validateInput.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleAnswers = this.handleAnswers.bind(this);
        this.tick = this.tick.bind(this);
        this.startTimer = this.startTimer.bind(this);
        this.stopTimer = this.stopTimer.bind(this);
        this.startTest = this.startTest.bind(this);
        this.endTest = this.endTest.bind(this);
    }

    validateInput() {
        return (this.state.name.length == 0 || this.state.group.length == 0 || this.state.variant == null);
    }

    handleChange(e) {
        if(e.target == undefined) {
            this.setState({
                variant: e
            });
            return;
        }
        const value = e.target.value.trim();
        const name = e.target.name;
        const state = this.state;
        state[name] = value;
        this.setState({
            state
        })
    }

    handleAnswers(e) {
        const answers = this.state.answers;
        const qN = e.split('-')[0];
        const aN = e.split('-')[1];
        answers[qN] = aN;
        this.setState({ answers });
    }

    startTimer() {
        const startTime = new Date();
        this.timer = setInterval(this.tick(new Date()), 50)
    }

    stopTimer() {
        // this.setState({
        //     elapsedTime: 0
        // });
        clearInterval(this.timer);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    tick(startTime) {
        return () => {
            const elapsedTime = Math.floor((new Date() - startTime) / 1000)
            if(elapsedTime.toFixed() <= 900) this.setState({
                elapsedTime
            });
            else this.endTest();
        };
    }

    startTest() {
        this.props.login(this.state.name, this.state.group, this.state.variant); 
        this.startTimer();
    }

    endTest() {
        this.stopTimer();
        this.props.setTime(this.state.elapsedTime);
        this.props.validateAnswers(this.props.testID, this.state.answers);
    }

    render() {
        const answerAllies = { TRUE: 'Верно', FALSE: 'Неверно', NONE: 'Нет ответа' }
        const testNames = ['Тест по теории', 'Тест по настройке оборудования', 'Комплексный тест']
        if (this.props.currentUser.status == userStatus.LOGGED_OUT) return (
            <div>
                <PageHeader>{testNames[this.props.testID] + ' '}<small>Регистрация</small></PageHeader>
                <FormGroup controlId="name">
                    <FormControl
                    type="text"
                    name='name'
                    value={this.state.name}
                    placeholder="Введите имя"
                    onChange={this.handleChange}
                    />
                </FormGroup>
                <FormGroup controlId="group">
                    <FormControl
                    type="text"
                    name='group'
                    value={this.state.group}
                    placeholder="Введите номер группы"
                    onChange={this.handleChange}
                    />
                </FormGroup>
                <ButtonToolbar>
                    <ToggleButtonGroup onChange={this.handleChange} type="radio" name="variant" defaultValue={null}>
                        <ToggleButton value={0}>Вариант 1</ToggleButton>
                        <ToggleButton value={1}>Вариант 2</ToggleButton>
                    </ToggleButtonGroup>
                </ButtonToolbar>
                <hr />
                <ButtonToolbar>
                    <Button 
                    bsStyle='primary' 
                    disabled={this.validateInput()} 
                    onClick={this.startTest}>
                        Начать тестирование
                    </Button>
                </ButtonToolbar>
            </div>
        );
        else if(this.props.currentUser.status == userStatus.WORKING) return (
            <div>
                <PageHeader>{testNames[this.props.testID] + ' '}<small>Времени прошло: {secToMin(this.state.elapsedTime.toFixed())}</small></PageHeader>
                {this.props.questions[this.props.testID][this.props.currentUser.variant].map((el,i) => {
                    return (
                        <Panel key={i} header={<h3>{el.q}</h3>}>
                            <ButtonToolbar>
                                <ToggleButtonGroup vertical onChange={this.handleAnswers} type="radio" name={`q-${i}`} defaultValue={null}>
                                    {el.a.map((e,j) => {
                                        return <ToggleButton key={j} value={`${i}-${j}`}>{e}</ToggleButton>
                                    })}
                                </ToggleButtonGroup>
                            </ButtonToolbar>
                        </Panel>
                    );
                })}
                <ButtonToolbar>
                    <Button 
                    bsStyle='primary' 
                    onClick={this.endTest}>
                        Закончить тестирование
                    </Button>
                </ButtonToolbar>
            </div>
        );
        else if(this.props.currentUser.status == userStatus.FINISHED) return (
            <div>
                <PageHeader>
                    {'Результаты '}
                    <small>
                        {this.props.currentUser.name}, 
                        гр. {this.props.currentUser.group}, 
                        вариант №{this.props.currentUser.variant + 1}, 
                        затраченное время {secToMin(this.state.elapsedTime.toFixed())}
                    </small>
                </PageHeader>
                <Table responsive striped bordered condensed hover>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Вопрос</th>
                            <th>Ответ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.questions[this.props.testID][this.props.currentUser.variant].map((question, i) => {
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{question.q}</td>
                                    <td>{answerAllies[this.props.currentUser.result[i]]}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                <h3>Набрано баллов: {Math.round(this.props.currentUser.result.filter(e => e == 'TRUE').length / this.props.currentUser.result.length * 10)}</h3>
                <ButtonToolbar>
                    <Button
                    bsStyle='primary'
                    onClick={this.props.saveResults(this.props.currentUser)}>
                        Сохранить результат
                    </Button>
                    <Button  
                    onClick={this.startTest}>
                        Пройти заново
                    </Button>
                    <Button  
                    onClick={() => { this.props.navigate('TESTS', this.props.testID) }}>
                        Вернуться назад
                    </Button>
                    <Button
                    onClick={this.props.navigateToMain}>
                        Вернуться на главную
                    </Button>
                </ButtonToolbar>
            </div>
        );
        else return <h1>Неизвестная ошибка.</h1>
    }
}

export default connect(
    state => state,
    dispatch => ({
        login(name, group, variant) { 
            dispatch(login(name, group, variant));
            console.log(name, group, variant);
        },
        validateAnswers(testID, answers) { 
            dispatch(validateAnswers(testID, answers))
        },
        setTime(value) {
            dispatch(setTime(value));
        },
        saveResults(currentUser) {
            dispatch(saveResults(currentUser))
        },
        navigateToMain() {
            dispatch(navigate('MAIN'));
        },
        retry() {
            dispatch(retry())
        }
    })
)(Tests);