import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../contexts/AuthContext";
import api from "../../services/api";

import { ButtonWallet, Navigation, Statement, Title, Subtitle, ContainerWallet } from "./style";
import { Button, Container, Form, Input, Loading } from "../../components/FormComponents"
import { BankBalance, Transaction } from "./Statement";

export default function Wallet() {
  const { token } = useContext(AuthContext);
  const [screen, setScreen] = useState("wallet");
  const [typeOfInput, setTypeOfInput] = useState("");
  const [transactions, setTransactions] = useState(undefined);
  const [formData, setFormData] = useState({ 
    value: "",
    description: "",
  });
  const navigate = useNavigate();
  const [disableForm, setDisableForm] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);
  const [idToUpdate, setIdToUpdate] = useState("");
  
  useEffect(() => {
    const promise = api.getTransactions(token);

    promise.then((response) => {
      setTransactions(response.data);
      const deficit = response.data.transactions.filter(res => res.type === "saída");
      const superavit = response.data.transactions.filter(res => res.type === "entrada");
      const balanceBank = calculateBalance(deficit, superavit);
    
      setBalance(balanceBank);
    });
    promise.catch(() => navigate("/"))
  }, [screen, isDeleted]);

  function changeToInput(type) {
    setScreen("add");
    setTypeOfInput(type);
  }

  function handleChange(e){
    setFormData({ ...formData, [e.target.name]: e.target.value});
  }

  async function handleSubmit(e){
    e.preventDefault();
    const isValueANumber = Number(formData.value);
    if (!isValueANumber || typeof formData.description !== "string" || isValueANumber < 0){
      return alert("Os dados não estão no formato correto");
    }
    setDisableForm(true);

    try {
        if (screen === "add"){
          const body = {
            ...formData,
            type: typeOfInput
          };
      
          await api.registrateTransaction(token.token, body);
        } 

        if (screen === "update") {
          await api.updateTransaction(token.token, idToUpdate, formData);
        }

        setScreen("wallet");
        setFormData({ 
          value: "",
          description: "",
        });
        setDisableForm(false);

    } catch (error) {
        alert(error.response.data);
        setDisableForm(false);
    }
  }

  if (screen !== "wallet") {
    return (
      <Container>
        <Title>
          { screen === "add" && `Nova ${typeOfInput}`}
          { screen === "update" && `Editar ${typeOfInput}`}
        </Title>
        <Form onSubmit={handleSubmit}>
          <Input 
              type="number"
              placeholder="Valor"
              name="value"
              onChange={handleChange}
              value={formData.value}
              required
              disabled={disableForm}
          />
          <Input 
              type="text"
              placeholder="Nome"
              name="description"
              onChange={handleChange}
              value={formData.description}
              required
              disabled={disableForm}
          />
          <Button disabled={disableForm} type="submit">
            {(!disableForm && screen === "add") && `Salvar ${typeOfInput}`}
            {(!disableForm && screen === "update") && `Atualizar ${typeOfInput}`}
            {disableForm && <Loading></Loading>}
          </Button>
        </Form>
      </Container>
    )
  }

  return (
    <ContainerWallet>
      <Title>
        <div className="username">
          <span>Olá, {token ? token.name: ""}</span> 
          <button className="logout" onClick={() => {
            localStorage.removeItem("token");
            navigate("/")
          }}>
            <ion-icon className="logout" name="log-out-outline"/>
          </button>
        </div>
      </Title>

      <Statement transactions={transactions?.transactions}>
        {transactions?.transactions.length === 0 && <Subtitle>Não há registros de entrada ou saída</Subtitle>}

        <div className="transactions">
          {transactions && transactions.transactions.map((t) => (
            <Transaction 
              key={t._id} 
              {...t} 
              setIsDeleted={setIsDeleted} 
              isDeleted={isDeleted} 
              setFormData={setFormData} 
              setScreen={setScreen}
              setTypeOfInput={setTypeOfInput}
              setIdToUpdate={setIdToUpdate}
            />
          ))}
        </div>

        {transactions?.transactions.length !== 0 && <BankBalance balance={balance} />}
      </Statement>

      <Navigation>
        <ButtonWallet onClick={() => changeToInput("entrada")}>
          <ion-icon name="add-circle-outline"/>
          <span>Nova</span>
          <span>entrada</span>
        </ButtonWallet>
        <ButtonWallet onClick={() => changeToInput("saída")}>
          <ion-icon name="remove-circle-outline"/>
          <span>Nova</span>
          <span>saída</span>
        </ButtonWallet>
      </Navigation>
    </ContainerWallet>
  );
}

function calculateBalance(deficit, superavit) {
  let totalDeficit = 0;
  for (let i = 0; i < deficit.length; i++) {
    totalDeficit += Number(deficit[i].value);
  }

  let totalSuperavit = 0;
  for (let i = 0; i < superavit.length; i++) {
    totalSuperavit += Number(superavit[i].value);
  }
  const balanceBank = (totalSuperavit - totalDeficit).toFixed(2);

  return balanceBank;
} 