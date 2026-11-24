<script setup>
import {ref,watch} from 'vue'
import api from '../services/api'
import {CITIES} from '../utils'
const props=defineProps({modelValue:{type:String,default:''},placeholder:{type:String,default:'Digite sua cidade'}})
const emit=defineEmits(['update:modelValue'])
const suggestions=ref(CITIES.map(name=>({name,uf:''})))
let timer
watch(()=>props.modelValue,(value)=>{
 clearTimeout(timer)
 if(!value||value.trim().length<2){suggestions.value=CITIES.map(name=>({name,uf:''}));return}
 timer=setTimeout(async()=>{try{
  const result=await api.get('/cities',{params:{q:value.trim()}})
  if(result.data?.length)suggestions.value=result.data
 }catch{suggestions.value=CITIES.filter(x=>x.toLowerCase().includes(value.toLowerCase())).map(name=>({name,uf:''}))}},350)
})
const listId=`alfred-cidades-${Math.random().toString(36).slice(2)}`
</script>
<template><div class="city-picker"><input type="text" class="form-control" :list="listId" :value="modelValue" :placeholder="placeholder" maxlength="90" autocomplete="address-level2" @input="emit('update:modelValue',$event.target.value)"/><datalist :id="listId"><option v-for="city in suggestions" :key="city.ibgeId||city.name" :value="city.name">{{city.uf}}</option></datalist></div></template>
